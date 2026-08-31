import { NextRequest, NextResponse } from "next/server";

// #region Mocks

jest.mock("server-only", () => ({}));

const protectInternalEndpointMock = jest.fn();
jest.mock("@/api/helpers/utils", () => ({
  protectInternalEndpoint: (...args: unknown[]) =>
    protectInternalEndpointMock(...args),
}));

const listCsvMock = jest.fn();
const downloadCsvMock = jest.fn();
jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  listCsv: (...args: unknown[]) => listCsvMock(...args),
  downloadCsv: (...args: unknown[]) => downloadCsvMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// #endregion

import { POST } from "@/api/_refresh-selfie-check-analytics";
import {
  filterAppsWithTotalsData,
  getDailyAppSnapshot,
  getDatasetMetadata,
  getTotalsAppSnapshot,
} from "@/api/helpers/selfie-check-analytics/redis-store";
import type { TableObjectDescriptor } from "@/api/helpers/selfie-check-analytics/s3";

const { logger: mockLogger } = jest.requireMock("@/lib/logger") as {
  logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock };
};

// #region Test data

const APP_ID_A = "app_0123456789abcdef0123456789abcdef";
const APP_ID_B = "app_fedcba9876543210fedcba9876543210";

const dailyCsv = [
  "PARTNER_APP_ID,DAY,OS_NAME,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_PROOFS,N_PROOF_USERS,CUMULATIVE_N_PROOFS,CUMULATIVE_N_PROOF_USERS,N_FACE_AUTH_STARTED_SESSIONS,N_FACE_AUTH_COMPLETED_SESSIONS,P_FACE_AUTH_COMPLETION",
  `${APP_ID_A},2026-08-29,iOS,10,2,8,27,20,10,8,0.8`,
  `${APP_ID_B},2026-08-29,Android,12,4,9,31,24,12,9,0.75`,
].join("\n");

const totalsCsv = (includeAppB = true) =>
  [
    "PARTNER_APP_ID,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_PROOFS,N_PROOF_USERS,N_FACE_AUTH_STARTED_SESSIONS,N_FACE_AUTH_COMPLETED_SESSIONS,P_FACE_AUTH_COMPLETION",
    `${APP_ID_A},10,3,8,10,8,0.8`,
    ...(includeAppB ? [`${APP_ID_B},12,7,9,12,9,0.75`] : []),
  ].join("\n");

const source = (
  prefix: "daily" | "total",
  revision: number,
): TableObjectDescriptor => ({
  bucket: "analytics-bucket",
  region: "eu-west-1",
  key: `${prefix}/data_20260830_0${revision}0000.csv`,
  etag: `\"etag-${prefix}-${revision}\"`,
  identity: `${prefix}:revision-${revision}`,
  dataAsOf: new Date(`2026-08-30T0${revision}:00:00.000Z`),
  lastModified: new Date(`2026-08-30T0${revision}:05:00.000Z`),
  sizeBytes: 100,
});

const request = () =>
  new NextRequest("http://localhost/api/_refresh-selfie-check-analytics", {
    method: "POST",
    headers: { "x-request-id": "request-123" },
  });

let dailyObject: TableObjectDescriptor;
let totalsObject: TableObjectDescriptor;
let dailyCsvValue: string;
let totalsCsvValue: string;

// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();

  dailyObject = source("daily", 1);
  totalsObject = source("total", 1);
  dailyCsvValue = dailyCsv;
  totalsCsvValue = totalsCsv();

  protectInternalEndpointMock.mockReturnValue({ isAuthenticated: true });
  listCsvMock.mockImplementation((prefix: string) =>
    Promise.resolve(prefix === "daily/" ? dailyObject : totalsObject),
  );
  downloadCsvMock.mockImplementation((object: TableObjectDescriptor) =>
    Promise.resolve({
      csv: object.key.startsWith("daily/") ? dailyCsvValue : totalsCsvValue,
      object,
    }),
  );
});

// #region Guards

describe("/_refresh-selfie-check-analytics [guards]", () => {
  it("returns the internal authentication error without reading S3", async () => {
    protectInternalEndpointMock.mockReturnValue({
      isAuthenticated: false,
      errorResponse: new NextResponse(null, { status: 403 }),
    });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(listCsvMock).not.toHaveBeenCalled();
  });

  it("returns 204 without downloading when another refresh owns the lock", async () => {
    await global.RedisClient?.set(
      "selfie-check-analytics:{analytics}:refresh-lock",
      "another-owner",
    );

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(listCsvMock).not.toHaveBeenCalled();
    expect(downloadCsvMock).not.toHaveBeenCalled();
  });
});

// #endregion

// #region Publication

describe("/_refresh-selfie-check-analytics [publication]", () => {
  it("publishes one consistent daily and totals pair", async () => {
    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(listCsvMock.mock.calls).toEqual([["daily/"], ["total/"]]);

    const dailyMeta = await getDatasetMetadata("daily");
    const totalsMeta = await getDatasetMetadata("totals");
    expect(dailyMeta?.appCount).toBe(2);
    expect(totalsMeta?.appCount).toBe(2);
    expect(dailyMeta?.publishedAt).toBe(totalsMeta?.publishedAt);

    await expect(getDailyAppSnapshot(APP_ID_A)).resolves.toEqual(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ appId: APP_ID_A }),
        ]),
      }),
    );
    await expect(getTotalsAppSnapshot(APP_ID_A)).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ appId: APP_ID_A }),
      }),
    );
  });

  it("filters app IDs without a cross-slot multi-key Redis command", async () => {
    await POST(request());
    const mget = jest.spyOn(global.RedisClient!, "mget");

    try {
      await expect(
        filterAppsWithTotalsData([
          APP_ID_A,
          "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          APP_ID_B,
        ]),
      ).resolves.toEqual([APP_ID_A, APP_ID_B]);
      expect(mget).not.toHaveBeenCalled();
    } finally {
      mget.mockRestore();
    }
  });

  it("renews unchanged snapshots on every hourly refresh", async () => {
    await POST(request());

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(downloadCsvMock).toHaveBeenCalledTimes(4);
  });

  it("keeps active metadata and expires snapshot rows for cleanup", async () => {
    await POST(request());
    const metadata = await getDatasetMetadata("daily");
    const metadataTtlMs = await global.RedisClient?.pttl(
      "selfie-check-analytics:{analytics}:metadata:daily",
    );
    const rowTtlMs = await global.RedisClient?.pttl(
      `selfie-check-analytics:daily:${metadata?.snapshotUID}:${APP_ID_A}`,
    );

    expect(metadataTtlMs).toBe(-1);
    expect(rowTtlMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
  });

  it("makes removed totals apps unreachable through the new snapshot", async () => {
    await POST(request());
    const firstMeta = await getDatasetMetadata("totals");

    dailyObject = source("daily", 2);
    totalsObject = source("total", 2);
    totalsCsvValue = totalsCsv(false);
    const response = await POST(request());
    const currentMeta = await getDatasetMetadata("totals");

    expect(response.status).toBe(204);
    expect(currentMeta?.snapshotUID).not.toBe(firstMeta?.snapshotUID);
    expect(currentMeta?.appCount).toBe(1);
    await expect(getTotalsAppSnapshot(APP_ID_B)).resolves.toBeNull();
  });

  it("does not publish either table when the daily CSV is invalid", async () => {
    dailyCsvValue = "PARTNER_APP_ID,N_PROOFS\ninvalid,1";

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(getDatasetMetadata("daily")).resolves.toBeNull();
    await expect(getDatasetMetadata("totals")).resolves.toBeNull();
    expect(listCsvMock).toHaveBeenCalledTimes(2);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to refresh"),
      expect.objectContaining({
        dependency: "s3",
        failureClass: "TableValidationError",
        requestId: "request-123",
      }),
    );
  });

  it("keeps both live pointers when a newer totals table is invalid", async () => {
    await POST(request());
    const previousDaily = await getDatasetMetadata("daily");
    const previousTotals = await getDatasetMetadata("totals");

    dailyObject = source("daily", 2);
    totalsObject = source("total", 2);
    totalsCsvValue = "PARTNER_APP_ID,N_PROOFS\ninvalid,1";

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(getDatasetMetadata("daily")).resolves.toEqual(previousDaily);
    await expect(getDatasetMetadata("totals")).resolves.toEqual(previousTotals);
  });

  it("keeps both live pointers when a Redis row write fails", async () => {
    await POST(request());
    const previousDaily = await getDatasetMetadata("daily");
    const previousTotals = await getDatasetMetadata("totals");
    dailyObject = source("daily", 2);
    totalsObject = source("total", 2);

    const redis = global.RedisClient!;
    const originalSet = redis.set.bind(redis);
    const set = jest.spyOn(redis, "set").mockImplementation(((
      key: string,
      ...args: unknown[]
    ) => {
      if (key.includes(":totals:") && key.endsWith(`:${APP_ID_A}`)) {
        return Promise.reject(new Error("Redis write failed"));
      }
      return Reflect.apply(originalSet, redis, [key, ...args]) as ReturnType<
        typeof redis.set
      >;
    }) as typeof redis.set);

    try {
      const response = await POST(request());

      expect(response.status).toBe(503);
      await expect(getDatasetMetadata("daily")).resolves.toEqual(previousDaily);
      await expect(getDatasetMetadata("totals")).resolves.toEqual(
        previousTotals,
      );
    } finally {
      set.mockRestore();
    }
  });

  it("rejects daily and totals exports from different timestamps", async () => {
    totalsObject = source("total", 2);

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(downloadCsvMock).not.toHaveBeenCalled();
    await expect(getDatasetMetadata("daily")).resolves.toBeNull();
    await expect(getDatasetMetadata("totals")).resolves.toBeNull();
  });

  it("returns 503 without hiding a Redis outage", async () => {
    const redis = global.RedisClient;
    global.RedisClient = undefined;

    try {
      const response = await POST(request());

      expect(response.status).toBe(503);
      expect(downloadCsvMock).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to refresh"),
        expect.objectContaining({
          dependency: "redis",
          failureClass: "AnalyticsRedisUnavailableError",
        }),
      );
    } finally {
      global.RedisClient = redis;
    }
  });
});

// #endregion
