jest.mock("server-only", () => ({}));

import {
  checkEligibility,
  filterSelfieCheckAnalyticsEnabledApps,
} from "@/api/helpers/selfie-check-analytics/eligibility";
import {
  AnalyticsRedisDataError,
  AnalyticsRedisUnavailableError,
} from "@/api/helpers/selfie-check-analytics/redis-store";

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const otherAppId = "app_fedcba9876543210fedcba9876543210";
const snapshotUID = "snapshot-1";
const originalRedis = global.RedisClient;

const metadata = {
  dataset: "totals",
  snapshotUID,
  appCount: 2,
  publishedAt: "2026-08-30T20:00:00.000Z",
  lastCheckedAt: "2026-08-30T20:00:00.000Z",
  source: {
    identity: "totals:source-1",
    key: "total/source-1.csv",
    dataAsOf: "2026-08-30T19:00:00.000Z",
    lastModified: "2026-08-30T19:05:00.000Z",
    sizeBytes: 100,
  },
};

const totalsRow = (id: string) => ({
  appId: id,
  n_users_started_selfie_check_flow: 10,
  n_proofs: 3,
  n_proof_users: 8,
  n_face_auth_started_sessions: 10,
  n_face_auth_completed_sessions: 8,
  p_face_auth_completion: 0.8,
});

const publishMetadata = async () => {
  await global.RedisClient?.set(
    "selfie-check-analytics:v2:{totals}:metadata",
    JSON.stringify(metadata),
  );
};

const publishTotalsRow = async (id: string) => {
  await global.RedisClient?.set(
    `selfie-check-analytics:v2:totals:${snapshotUID}:${id}`,
    JSON.stringify(totalsRow(id)),
  );
};
// #endregion

beforeEach(async () => {
  jest.restoreAllMocks();
  global.RedisClient = originalRedis;
  await global.RedisClient?.flushall();
});

afterAll(() => {
  global.RedisClient = originalRedis;
});

// #region Eligibility behavior
describe("checkEligibility", () => {
  it("returns false before a totals snapshot has been published", async () => {
    await expect(checkEligibility(appId)).resolves.toBe(false);
  });

  it("returns true when the app has a valid row in the live totals snapshot", async () => {
    await publishMetadata();
    await publishTotalsRow(appId);

    await expect(checkEligibility(appId)).resolves.toBe(true);
  });

  it("returns false when the app is absent from the live totals snapshot", async () => {
    await publishMetadata();

    await expect(checkEligibility(appId)).resolves.toBe(false);
  });

  it("does not hide corrupt stored data as ineligibility", async () => {
    await publishMetadata();
    await global.RedisClient?.set(
      `selfie-check-analytics:v2:totals:${snapshotUID}:${appId}`,
      "not-json",
    );

    await expect(checkEligibility(appId)).rejects.toThrow(
      AnalyticsRedisDataError,
    );
  });

  it("does not hide a Redis outage as ineligibility", async () => {
    global.RedisClient = undefined;

    await expect(checkEligibility(appId)).rejects.toThrow(
      AnalyticsRedisUnavailableError,
    );
  });
});
// #endregion

// #region Batch filtering
describe("filterSelfieCheckAnalyticsEnabledApps", () => {
  it("keeps only apps present in the live totals snapshot", async () => {
    await publishMetadata();
    await publishTotalsRow(appId);

    await expect(
      filterSelfieCheckAnalyticsEnabledApps([appId, otherAppId]),
    ).resolves.toEqual([appId]);
  });

  it("returns an empty result without reading metadata for empty input", async () => {
    const get = jest.spyOn(global.RedisClient!, "get");

    await expect(filterSelfieCheckAnalyticsEnabledApps([])).resolves.toEqual(
      [],
    );
    expect(get).not.toHaveBeenCalled();
  });
});
// #endregion
