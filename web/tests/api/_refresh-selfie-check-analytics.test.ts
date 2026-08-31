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
  getAppFromRedis,
  getDatasetMetadata,
} from "@/api/helpers/selfie-check-analytics/redis-store";
import type { TableObjectDescriptor } from "@/api/helpers/selfie-check-analytics/s3";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";

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
      "selfie-check-analytics:v2:{daily}:refresh-lock",
      "another-owner",
    );

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(listCsvMock).toHaveBeenCalledWith("daily/");
    expect(downloadCsvMock).not.toHaveBeenCalled();
  });
});

// #endregion

// #region Publication

describe("/_refresh-selfie-check-analytics [publication]", () => {
  it("publishes daily before totals and stores one value per app", async () => {
    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(listCsvMock.mock.calls).toEqual([["daily/"], ["total/"]]);

    const dailyMeta = await getDatasetMetadata("daily");
    const totalsMeta = await getDatasetMetadata("totals");
    expect(dailyMeta?.appCount).toBe(2);
    expect(totalsMeta?.appCount).toBe(2);

    await expect(
      getAppFromRedis<readonly DailyRow[]>(
        "daily",
        dailyMeta!.snapshotUID,
        APP_ID_A,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ appId: APP_ID_A })]),
    );
    await expect(
      getAppFromRedis<TotalsRow>("totals", totalsMeta!.snapshotUID, APP_ID_A),
    ).resolves.toEqual(expect.objectContaining({ appId: APP_ID_A }));
  });

  it("skips downloads when both S3 identities are already published", async () => {
    await POST(request());
    const firstDownloadCount = downloadCsvMock.mock.calls.length;

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(downloadCsvMock).toHaveBeenCalledTimes(firstDownloadCount);
  });

  it("makes removed totals apps unreachable through the new snapshot", async () => {
    await POST(request());
    const firstMeta = await getDatasetMetadata("totals");

    totalsObject = source("total", 2);
    totalsCsvValue = totalsCsv(false);
    const response = await POST(request());
    const currentMeta = await getDatasetMetadata("totals");

    expect(response.status).toBe(204);
    expect(currentMeta?.snapshotUID).not.toBe(firstMeta?.snapshotUID);
    expect(currentMeta?.appCount).toBe(1);
    await expect(
      getAppFromRedis("totals", currentMeta!.snapshotUID, APP_ID_B),
    ).resolves.toBeNull();
  });

  it("does not publish totals when the daily CSV is invalid", async () => {
    dailyCsvValue = "PARTNER_APP_ID,N_PROOFS\ninvalid,1";

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(getDatasetMetadata("daily")).resolves.toBeNull();
    await expect(getDatasetMetadata("totals")).resolves.toBeNull();
    expect(listCsvMock).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to refresh"),
      expect.objectContaining({
        dependency: "s3",
        failureClass: "TableValidationError",
        requestId: "request-123",
      }),
    );
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
