// #region Mocks
const listCsvMock = jest.fn();
const downloadCsvMock = jest.fn();

jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  listCsv: (...args: unknown[]) => listCsvMock(...args),
  downloadCsv: (...args: unknown[]) => downloadCsvMock(...args),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
// #endregion

import {
  clearTableCaches,
  loadLatestDailyTableSnapshot,
  loadLatestTotalsTableSnapshot,
} from "@/api/helpers/selfie-check-analytics/snapshots";
import { logger } from "@/lib/logger";
import type { TableObjectDescriptor } from "@/api/helpers/selfie-check-analytics/s3";

// #region Test Data
const appIdA = "app_0123456789abcdef0123456789abcdef";
const appIdB = "app_fedcba9876543210fedcba9876543210";

const source = (
  key: string,
  etag: string,
  lastModified = "2026-08-26T21:00:00.000Z",
): TableObjectDescriptor => ({
  bucket: "analytics-bucket",
  region: "eu-west-1",
  key,
  etag,
  identity: `${key}:${etag}`,
  dataAsOf: new Date(lastModified),
  lastModified: new Date(lastModified),
  sizeBytes: 100,
});

const totalsCsv = (proofsA = 3) =>
  [
    "PARTNER_APP_ID,N_USERS_STARTED_AT_LEAST_ONE_SELFIE_CHECK_FLOW,N_USERS_SHARED_AT_LEAST_ONE_PROOF,N_SELFIE_CHECK_STARTED_SESSIONS,N_FACE_CAPTURE_STARTED_SESSIONS,N_FACE_CAPTURE_COMPLETED_SESSIONS,N_PROOF_SHARED_SESSIONS,P_SELFIE_CHECK_TO_FACE_CAPTURE_STARTED_COMPLETION,P_FACE_CAPTURE_STARTED_TO_COMPLETED_COMPLETION,P_FACE_CAPTURE_COMPLETED_TO_PROOF_SHARED_COMPLETION",
    `${appIdA},10,8,10,9,8,${proofsA},0.9,0.75,0.5`,
    `${appIdB},10,8,10,9,8,7,0.9,0.75,0.5`,
  ].join("\n");

const dailyCsv = () =>
  [
    "PARTNER_APP_ID,DAY,OS_NAME,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_USERS_SHARED_A_PROOF,CUMULATIVE_N_USERS_SHARED_A_PROOF,P_FACE_CAPTURE_COMPLETION",
    `${appIdA},2026-08-25,iOS,10,8,20,0.8`,
    `${appIdA},2026-08-26,Android,10,8,20,0.8`,
  ].join("\n");
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  clearTableCaches();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-26T22:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

// #region Independent table policies
describe("selfie-check analytics table snapshots", () => {
  it("loads totals into the one-row-per-app map", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    listCsvMock.mockResolvedValue(object);
    downloadCsvMock.mockResolvedValue({ csv: totalsCsv(), object });

    const snapshot = await loadLatestTotalsTableSnapshot();

    expect(snapshot.isFallback).toBe(false);
    expect(snapshot.loadedAt).toBe("2026-08-26T22:00:00.000Z");
    expect(snapshot.records.get(appIdA)?.n_proof_shared_sessions).toBe(3);
    expect(listCsvMock).toHaveBeenCalledWith("total/");
    expect(downloadCsvMock).toHaveBeenCalledWith(object);
  });

  it("keeps totals and daily cache and single-flight state independent", async () => {
    const totalObject = source("total/run-1.csv", '"etag-total"');
    const dailyObject = source("daily/run-1.csv", '"etag-daily"');

    listCsvMock.mockImplementation((prefix: string) =>
      Promise.resolve(prefix === "total/" ? totalObject : dailyObject),
    );
    downloadCsvMock.mockImplementation((object: TableObjectDescriptor) =>
      Promise.resolve({
        csv: object.key.startsWith("total/") ? totalsCsv() : dailyCsv(),
        object,
      }),
    );

    const [totals, daily] = await Promise.all([
      loadLatestTotalsTableSnapshot(),
      loadLatestDailyTableSnapshot(),
    ]);
    await Promise.all([
      loadLatestTotalsTableSnapshot(),
      loadLatestDailyTableSnapshot(),
    ]);

    expect(totals.records.get(appIdA)?.n_proof_shared_sessions).toBe(3);
    expect(daily.records.get(appIdA)).toHaveLength(2);
    expect(listCsvMock).toHaveBeenCalledTimes(2);
    expect(downloadCsvMock).toHaveBeenCalledTimes(2);
  });
});
// #endregion

// #region Refresh and fallback behavior
describe("table snapshot refresh behavior", () => {
  it("rechecks S3 after 60 seconds without redownloading an unchanged object", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    listCsvMock.mockResolvedValue(object);
    downloadCsvMock.mockResolvedValue({ csv: totalsCsv(), object });

    await loadLatestTotalsTableSnapshot();
    jest.setSystemTime(new Date("2026-08-26T22:01:01.000Z"));
    const snapshot = await loadLatestTotalsTableSnapshot();

    expect(snapshot.isFallback).toBe(false);
    expect(snapshot.lastCheckedAt).toBe("2026-08-26T22:01:01.000Z");
    expect(listCsvMock).toHaveBeenCalledTimes(2);
    expect(downloadCsvMock).toHaveBeenCalledTimes(1);
  });

  it("atomically replaces a map only when a new object validates", async () => {
    const first = source("total/run-1.csv", '"etag-1"');
    const second = source(
      "total/run-2.csv",
      '"etag-2"',
      "2026-08-26T22:00:00.000Z",
    );
    listCsvMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    downloadCsvMock
      .mockResolvedValueOnce({ csv: totalsCsv(3), object: first })
      .mockResolvedValueOnce({ csv: totalsCsv(9), object: second });

    const original = await loadLatestTotalsTableSnapshot();
    const updated = await loadLatestTotalsTableSnapshot({
      forceRefresh: true,
    });

    expect(original.records.get(appIdA)?.n_proof_shared_sessions).toBe(3);
    expect(updated.records.get(appIdA)?.n_proof_shared_sessions).toBe(9);
    expect(updated.source.identity).toBe('total/run-2.csv:"etag-2"');
  });

  it("serves the previous verified map when refresh fails", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    listCsvMock
      .mockResolvedValueOnce(object)
      .mockRejectedValueOnce(new Error("S3 unavailable"));
    downloadCsvMock.mockResolvedValue({ csv: totalsCsv(), object });

    const original = await loadLatestTotalsTableSnapshot();
    const fallback = await loadLatestTotalsTableSnapshot({
      forceRefresh: true,
    });

    expect(fallback.isFallback).toBe(true);
    expect(fallback.records).toBe(original.records);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("serving the last verified snapshot"),
      expect.objectContaining({
        dependency: "s3",
        dataset: "selfie_check_totals",
        failureClass: "Error",
      }),
    );
  });

  it("does not replace verified data with an invalid new CSV", async () => {
    const first = source("total/run-1.csv", '"etag-1"');
    const second = source("total/run-2.csv", '"etag-2"');
    listCsvMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    downloadCsvMock
      .mockResolvedValueOnce({ csv: totalsCsv(), object: first })
      .mockResolvedValueOnce({
        csv: "PARTNER_APP_ID,N_PROOFS\ninvalid,4\n",
        object: second,
      });

    const original = await loadLatestTotalsTableSnapshot();
    const fallback = await loadLatestTotalsTableSnapshot({
      forceRefresh: true,
    });

    expect(fallback.isFallback).toBe(true);
    expect(fallback.source.identity).toBe(original.source.identity);
    expect(fallback.records).toBe(original.records);
  });

  it("backs off repeated cold-start failures", async () => {
    listCsvMock.mockRejectedValue(new Error("S3 unavailable"));

    await expect(loadLatestTotalsTableSnapshot()).rejects.toThrow(
      "S3 unavailable",
    );
    await expect(loadLatestTotalsTableSnapshot()).rejects.toThrow(
      "S3 unavailable",
    );
    expect(listCsvMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date("2026-08-26T22:01:01.000Z"));
    await expect(loadLatestTotalsTableSnapshot()).rejects.toThrow(
      "S3 unavailable",
    );
    expect(listCsvMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent refreshes within one table", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    let resolveDiscovery: ((value: TableObjectDescriptor) => void) | undefined;
    listCsvMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDiscovery = resolve;
      }),
    );
    downloadCsvMock.mockResolvedValue({ csv: totalsCsv(), object });

    const first = loadLatestTotalsTableSnapshot();
    const second = loadLatestTotalsTableSnapshot();
    resolveDiscovery?.(object);
    await Promise.all([first, second]);

    expect(listCsvMock).toHaveBeenCalledTimes(1);
    expect(downloadCsvMock).toHaveBeenCalledTimes(1);
  });
});
// #endregion
