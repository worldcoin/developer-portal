// #region Mocks
const findLatestTotalsObjectMock = jest.fn();
const downloadTotalsCsvMock = jest.fn();

jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  findLatestTotalsObject: (...args: unknown[]) =>
    findLatestTotalsObjectMock(...args),
  downloadTotalsCsv: (...args: unknown[]) => downloadTotalsCsvMock(...args),
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
  clearTableCache,
  loadLatestTableSnapshot,
  parseMetricsTable,
  TableCsvValidationError,
} from "@/api/helpers/selfie-check-analytics/format-metrics-tables";
import { logger } from "@/lib/logger";

// #region Test Data
const appIdA = "app_0123456789abcdef0123456789abcdef";
const appIdB = "app_fedcba9876543210fedcba9876543210";

const source = (
  key: string,
  etag: string,
  lastModified = "2026-08-26T21:00:00.000Z",
) => ({
  bucket: "analytics-bucket",
  region: "eu-west-1",
  key,
  etag,
  identity: `${key}:${etag}`,
  lastModified: new Date(lastModified),
  sizeBytes: 100,
});

const csv = (proofsA = 3, proofsB = 7) =>
  [
    "PARTNER_APP_ID,N_PROOFS,P_FACE_AUTH_COMPLETION",
    `${appIdA},${proofsA},\"0.75\"`,
    `${appIdB},${proofsB},`,
  ].join("\n");
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  clearTableCache();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-26T22:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

// #region CSV validation
describe("parseMetricsTable", () => {
  it("normalizes headers and indexes typed metrics by app ID", () => {
    const result = parseMetricsTable(
      `\uFEFFpartner_app_id,n_proofs,p_face_auth_completion\n${appIdA},3,\"0.75\"\n`,
    );

    expect(result.headers).toEqual([
      "PARTNER_APP_ID",
      "N_PROOFS",
      "P_FACE_AUTH_COMPLETION",
    ]);
    expect(result.records.get(appIdA)).toEqual({
      appId: appIdA,
      metrics: {
        n_proofs: 3,
        p_face_auth_completion: 0.75,
      },
    });
  });

  it("accepts APP_ID as the unique-key column", () => {
    const result = parseMetricsTable(`APP_ID,N_PROOFS\n${appIdA},3\n`);

    expect(result.records.get(appIdA)?.metrics.N_PROOFS).toBeUndefined();
    expect(result.records.get(appIdA)?.metrics.n_proofs).toBe(3);
  });

  it("represents an empty metric as null", () => {
    const result = parseMetricsTable(`APP_ID,N_PROOFS\n${appIdA},\n`);

    expect(result.records.get(appIdA)?.metrics.n_proofs).toBeNull();
  });

  it("rejects non-numeric metric values", () => {
    expect(() =>
      parseMetricsTable(`APP_ID,N_PROOFS\n${appIdA},not-a-number\n`),
    ).toThrow("is not a non-negative number");
  });

  it("rejects duplicate app IDs", () => {
    expect(() =>
      parseMetricsTable(`PARTNER_APP_ID,N_PROOFS\n${appIdA},3\n${appIdA},4\n`),
    ).toThrow("duplicate app ID");
  });

  it("rejects duplicate normalized headers", () => {
    expect(() =>
      parseMetricsTable(`PARTNER_APP_ID,n_proofs,N_PROOFS\n${appIdA},3,4\n`),
    ).toThrow("duplicate header");
  });

  it("rejects a missing app ID column", () => {
    expect(() => parseMetricsTable("N_PROOFS\n3\n")).toThrow(
      "must contain one of",
    );
  });

  it("rejects malformed app IDs", () => {
    expect(() =>
      parseMetricsTable("PARTNER_APP_ID,N_PROOFS\nnot-an-app,3\n"),
    ).toThrow("invalid app ID");
  });

  it("wraps malformed CSV as a validation error", () => {
    expect(() =>
      parseMetricsTable(`PARTNER_APP_ID,N_PROOFS\n${appIdA},\"unterminated\n`),
    ).toThrow(TableCsvValidationError);
  });
});
// #endregion

// #region Snapshot refresh and caching
describe("loadLatestTableSnapshot", () => {
  it("downloads and parses a cold snapshot", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    findLatestTotalsObjectMock.mockResolvedValue(object);
    downloadTotalsCsvMock.mockResolvedValue({ csv: csv(), object });

    const snapshot = await loadLatestTableSnapshot();

    expect(snapshot.isFallback).toBe(false);
    expect(snapshot.loadedAt).toBe("2026-08-26T22:00:00.000Z");
    expect(snapshot.source.identity).toBe('total/run-1.csv:"etag-1"');
    expect(snapshot.records.get(appIdA)?.metrics.n_proofs).toBe(3);
    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(1);
    expect(downloadTotalsCsvMock).toHaveBeenCalledWith(object);
  });

  it("serves the process cache without listing again inside the check interval", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    findLatestTotalsObjectMock.mockResolvedValue(object);
    downloadTotalsCsvMock.mockResolvedValue({ csv: csv(), object });

    await loadLatestTableSnapshot();
    await loadLatestTableSnapshot();

    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(1);
    expect(downloadTotalsCsvMock).toHaveBeenCalledTimes(1);
  });

  it("rechecks S3 but does not redownload an unchanged ETag", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    findLatestTotalsObjectMock.mockResolvedValue(object);
    downloadTotalsCsvMock.mockResolvedValue({ csv: csv(), object });

    await loadLatestTableSnapshot();
    jest.setSystemTime(new Date("2026-08-26T23:00:01.000Z"));
    const snapshot = await loadLatestTableSnapshot();

    expect(snapshot.isFallback).toBe(false);
    expect(snapshot.lastCheckedAt).toBe("2026-08-26T23:00:01.000Z");
    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(2);
    expect(downloadTotalsCsvMock).toHaveBeenCalledTimes(1);
  });

  it("atomically replaces the map when a new object validates", async () => {
    const first = source("total/run-1.csv", '"etag-1"');
    const second = source(
      "total/run-2.csv",
      '"etag-2"',
      "2026-08-26T22:00:00.000Z",
    );
    findLatestTotalsObjectMock
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    downloadTotalsCsvMock
      .mockResolvedValueOnce({ csv: csv(3), object: first })
      .mockResolvedValueOnce({ csv: csv(9), object: second });

    const original = await loadLatestTableSnapshot();
    const updated = await loadLatestTableSnapshot({ forceRefresh: true });

    expect(original.records.get(appIdA)?.metrics.n_proofs).toBe(3);
    expect(updated.records.get(appIdA)?.metrics.n_proofs).toBe(9);
    expect(updated.source.identity).toBe('total/run-2.csv:"etag-2"');
  });

  it("serves the previous verified map when refresh fails", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    findLatestTotalsObjectMock
      .mockResolvedValueOnce(object)
      .mockRejectedValueOnce(new Error("S3 unavailable"));
    downloadTotalsCsvMock.mockResolvedValue({ csv: csv(), object });

    const original = await loadLatestTableSnapshot();
    const fallback = await loadLatestTableSnapshot({ forceRefresh: true });

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
    findLatestTotalsObjectMock
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    downloadTotalsCsvMock
      .mockResolvedValueOnce({ csv: csv(), object: first })
      .mockResolvedValueOnce({
        csv: "PARTNER_APP_ID,N_PROOFS\ninvalid,4\n",
        object: second,
      });

    const original = await loadLatestTableSnapshot();
    const fallback = await loadLatestTableSnapshot({ forceRefresh: true });

    expect(fallback.isFallback).toBe(true);
    expect(fallback.source.identity).toBe(original.source.identity);
    expect(fallback.records).toBe(original.records);
  });

  it("surfaces a cold-start failure instead of returning an empty table", async () => {
    findLatestTotalsObjectMock.mockRejectedValue(new Error("S3 unavailable"));

    await expect(loadLatestTableSnapshot()).rejects.toThrow("S3 unavailable");
    expect(downloadTotalsCsvMock).not.toHaveBeenCalled();
  });

  it("backs off repeated cold-start failures", async () => {
    findLatestTotalsObjectMock.mockRejectedValue(new Error("S3 unavailable"));

    await expect(loadLatestTableSnapshot()).rejects.toThrow("S3 unavailable");
    await expect(loadLatestTableSnapshot()).rejects.toThrow("S3 unavailable");
    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date("2026-08-26T22:01:01.000Z"));
    await expect(loadLatestTableSnapshot()).rejects.toThrow("S3 unavailable");
    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent cold refreshes", async () => {
    const object = source("total/run-1.csv", '"etag-1"');
    let resolveDiscovery: ((value: typeof object) => void) | undefined;
    findLatestTotalsObjectMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDiscovery = resolve;
      }),
    );
    downloadTotalsCsvMock.mockResolvedValue({ csv: csv(), object });

    const first = loadLatestTableSnapshot();
    const second = loadLatestTableSnapshot();
    resolveDiscovery?.(object);
    await Promise.all([first, second]);

    expect(findLatestTotalsObjectMock).toHaveBeenCalledTimes(1);
    expect(downloadTotalsCsvMock).toHaveBeenCalledTimes(1);
  });
});
// #endregion
