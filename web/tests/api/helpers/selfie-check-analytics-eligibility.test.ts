import { resolveSelfieCheckAnalyticsEligibility } from "@/api/helpers/selfie-check-analytics/eligibility";
import { clearTableCaches } from "@/api/helpers/selfie-check-analytics/snapshots";
import { logger } from "@/lib/logger";
import {
  appId,
  otherAppId,
  source,
  totalsCsv,
} from "../../fixtures/selfie-check-analytics";

// #region Mocks
const listCsv = jest.fn();
const downloadCsv = jest.fn();
jest.mock("@/api/helpers/selfie-check-analytics/s3", () => ({
  listCsv: (...args: unknown[]) => listCsv(...args),
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
// #endregion

beforeEach(() => {
  jest.resetAllMocks();
  clearTableCaches();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-08-26T22:00:00Z"));
  listCsv.mockResolvedValue(source());
  downloadCsv.mockResolvedValue({ object: source(), csv: totalsCsv() });
});
afterEach(() => jest.useRealTimers());

// #region Verified totals membership
describe("analytics eligibility", () => {
  it("returns a zero-valued entry and the reusable snapshot without daily I/O", async () => {
    const result = await resolveSelfieCheckAnalyticsEligibility(appId);
    expect(result.entry?.n_proof_shared_sessions).toBe(0);
    expect(result.entry).toBe(result.snapshot.records.get(appId));
    expect(result.snapshot.isFallback).toBe(false);
    expect(listCsv).toHaveBeenCalledTimes(1);
    expect(listCsv).toHaveBeenCalledWith("total/");
  });

  it("treats missing membership as normal absence", async () => {
    expect(
      (await resolveSelfieCheckAnalyticsEligibility(otherAppId)).entry,
    ).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("adds and removes membership only after a successful refresh", async () => {
    expect(
      (await resolveSelfieCheckAnalyticsEligibility(appId)).entry,
    ).toBeDefined();
    listCsv.mockResolvedValue(source("total/", 2));
    downloadCsv.mockResolvedValue({
      object: source("total/", 2),
      csv: totalsCsv([otherAppId], 5),
    });
    expect(
      (await resolveSelfieCheckAnalyticsEligibility(otherAppId)).entry,
    ).toBeUndefined();
    jest.advanceTimersByTime(60_000);
    expect(
      (await resolveSelfieCheckAnalyticsEligibility(otherAppId)).entry
        ?.n_proof_shared_sessions,
    ).toBe(5);
    expect(
      (await resolveSelfieCheckAnalyticsEligibility(appId)).entry,
    ).toBeUndefined();
  });

  it("shares in-flight loads with all eligibility callers", async () => {
    let resolve!: (value: ReturnType<typeof source>) => void;
    listCsv.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const first = resolveSelfieCheckAnalyticsEligibility(appId);
    const second = resolveSelfieCheckAnalyticsEligibility(otherAppId);
    expect(listCsv).toHaveBeenCalledTimes(1);
    resolve(source());
    await Promise.all([first, second]);
    expect(downloadCsv).toHaveBeenCalledTimes(1);
  });
});
// #endregion

// #region Failure, backoff, and recovery
describe("eligibility dependency failures", () => {
  it.each(["S3 timeout", "S3 503"])(
    "propagates %s without a cached snapshot and backs off",
    async (message) => {
      listCsv.mockRejectedValue(new Error(message));
      await expect(
        resolveSelfieCheckAnalyticsEligibility(appId),
      ).rejects.toThrow(message);
      await expect(
        resolveSelfieCheckAnalyticsEligibility(appId),
      ).rejects.toThrow(message);
      expect(listCsv).toHaveBeenCalledTimes(1);
      listCsv.mockResolvedValue(source());
      jest.advanceTimersByTime(60_000);
      expect(
        (await resolveSelfieCheckAnalyticsEligibility(appId)).snapshot
          .isFallback,
      ).toBe(false);
    },
  );

  it("rejects malformed exports on cold start", async () => {
    downloadCsv.mockResolvedValue({ object: source(), csv: "invalid,csv" });
    await expect(
      resolveSelfieCheckAnalyticsEligibility(appId),
    ).rejects.toThrow();
  });

  it.each(["unreadable", "malformed"])(
    "preserves verified membership through an %s new export and recovers",
    async (failure) => {
      const original = await resolveSelfieCheckAnalyticsEligibility(appId);
      listCsv.mockResolvedValue(source("total/", 2));
      if (failure === "unreadable")
        downloadCsv.mockRejectedValue(new Error("S3 503"));
      else
        downloadCsv.mockResolvedValue({
          object: source("total/", 2),
          csv: "invalid,csv",
        });
      jest.advanceTimersByTime(60_000);
      const fallback = await resolveSelfieCheckAnalyticsEligibility(appId);
      expect(fallback.entry).toBe(original.entry);
      expect(fallback.snapshot.isFallback).toBe(true);
      expect(
        (await resolveSelfieCheckAnalyticsEligibility(otherAppId)).entry,
      ).toBeUndefined();
      expect(downloadCsv).toHaveBeenCalledTimes(2);
      downloadCsv.mockResolvedValue({
        object: source("total/", 2),
        csv: totalsCsv([otherAppId]),
      });
      jest.advanceTimersByTime(60_000);
      expect(
        (await resolveSelfieCheckAnalyticsEligibility(appId)).entry,
      ).toBeUndefined();
      expect(
        (await resolveSelfieCheckAnalyticsEligibility(otherAppId)).snapshot
          .isFallback,
      ).toBe(false);
    },
  );
});
// #endregion
