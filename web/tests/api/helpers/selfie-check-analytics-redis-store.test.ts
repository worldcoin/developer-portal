import {
  AnalyticsRedisDataError,
  AnalyticsRedisUnavailableError,
  AnalyticsSnapshotConflictError,
  analyticsRedisKeys,
  getAnalyticsSnapshotMetadata,
  getDailyForApp,
  getTotalsForApp,
  publishAnalyticsSnapshot,
  releaseAnalyticsRefreshLock,
  tryAcquireAnalyticsRefreshLock,
  type AnalyticsDataset,
  type AnalyticsRefreshLock,
} from "@/api/helpers/selfie-check-analytics/redis-store";
import type { TableObjectDescriptor } from "@/api/helpers/selfie-check-analytics/s3";
import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";

// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Exercise the real store and Lua scripts using the shared I/O-boundary mock.
const redis = global.RedisClient!;
// #endregion

// #region Test Data
const appIdA = "app_0123456789abcdef0123456789abcdef";
const appIdB = "app_fedcba9876543210fedcba9876543210";

const makeTotals = (overrides: Partial<TotalsRow> = {}): TotalsRow => ({
  appId: appIdA,
  n_users_started_at_least_one_selfie_check_flow: 10,
  n_users_shared_at_least_one_proof: 8,
  n_selfie_check_started_sessions: 12,
  n_face_capture_started_sessions: 10,
  n_face_capture_completed_sessions: 9,
  n_proof_shared_sessions: 8,
  p_selfie_check_to_face_capture_started_completion: 10 / 12,
  p_face_capture_started_to_completed_completion: 0.9,
  p_face_capture_completed_to_proof_shared_completion: null,
  ...overrides,
});

const makeDaily = (overrides: Partial<DailyRow> = {}): DailyRow => ({
  appId: appIdA,
  day: "2026-09-03",
  os_name: "iOS",
  n_users_started_selfie_check_flow: 5,
  n_users_shared_a_proof: 4,
  cumulative_n_users_shared_a_proof: 8,
  p_face_capture_completion: null,
  ...overrides,
});

const makeSource = (
  overrides: Partial<TableObjectDescriptor> = {},
): TableObjectDescriptor => ({
  bucket: "analytics-bucket",
  region: "eu-west-1",
  key: "total/data_20260903_220000.csv",
  etag: '"etag-1"',
  identity: 'total/data_20260903_220000.csv:"etag-1"',
  dataAsOf: new Date("2026-09-03T22:00:00.000Z"),
  lastModified: new Date("2026-09-03T22:01:00.000Z"),
  sizeBytes: 1_024,
  ...overrides,
});

async function acquire(dataset: AnalyticsDataset = "total") {
  const lock = await tryAcquireAnalyticsRefreshLock(dataset);
  if (!lock) throw new Error("Expected an available refresh lock");
  return lock;
}

async function publishTotals({
  rows = [makeTotals()],
  source = makeSource(),
  lock,
}: {
  rows?: readonly TotalsRow[];
  source?: TableObjectDescriptor;
  lock?: AnalyticsRefreshLock;
} = {}) {
  const ownedLock = lock ?? (await acquire());
  try {
    return await publishAnalyticsSnapshot({
      dataset: "total",
      lock: ownedLock,
      source,
      records: new Map(rows.map((row) => [row.appId, row])),
    });
  } finally {
    if (!lock) await releaseAnalyticsRefreshLock(ownedLock);
  }
}

async function publishDaily(rows = [makeDaily()]) {
  const lock = await acquire("daily");
  try {
    return await publishAnalyticsSnapshot({
      dataset: "daily",
      lock,
      source: makeSource({
        key: "daily/data_20260903_220000.csv",
        identity: 'daily/data_20260903_220000.csv:"etag-1"',
      }),
      records: new Map([[appIdA, rows]]),
    });
  } finally {
    await releaseAnalyticsRefreshLock(lock);
  }
}
// #endregion

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  global.RedisClient = redis;
  await redis.flushall();
});

afterEach(() => {
  jest.restoreAllMocks();
  global.RedisClient = redis;
});

// #region Storage contract and getters
describe("analytics Redis snapshots [reads]", () => {
  it("uses app/type/result keys and co-locates publication control keys", () => {
    expect(analyticsRedisKeys.data("total", appIdA, "version-1")).toBe(
      `selfie-check-analytics:${appIdA}:total:row:version-1`,
    );
    expect(analyticsRedisKeys.data("daily", appIdA, "version-1")).toBe(
      `selfie-check-analytics:${appIdA}:daily:rows:version-1`,
    );
    for (const dataset of ["total", "daily"] as const) {
      expect(analyticsRedisKeys.metadata(dataset)).toBe(
        `selfie-check-analytics:{${dataset}}:meta`,
      );
      expect(analyticsRedisKeys.refreshLock(dataset)).toBe(
        `selfie-check-analytics:{${dataset}}:refresh-lock`,
      );
    }
  });

  it("reads only the requested app's totals and preserves null metrics", async () => {
    const metadata = await publishTotals({
      rows: [
        makeTotals(),
        makeTotals({ appId: appIdB, n_proof_shared_sessions: 99 }),
      ],
    });
    const get = jest.spyOn(redis, "get");
    expect(await getTotalsForApp(appIdA)).toEqual({
      data: makeTotals(),
      metadata,
    });
    expect(metadata).toMatchObject({
      schemaVersion: 1,
      appCount: 2,
      isFallback: false,
      source: { dataAsOf: "2026-09-03T22:00:00.000Z" },
    });
    expect(get.mock.calls.map(([key]) => key)).toEqual([
      analyticsRedisKeys.metadata("total"),
      analyticsRedisKeys.data("total", appIdA, metadata.snapshotId),
    ]);
  });

  it("preserves daily order and distinct OS rows for the same day", async () => {
    const rows = [
      makeDaily(),
      makeDaily({ os_name: "Android" }),
      makeDaily({ day: "2026-09-02" }),
    ];
    const metadata = await publishDaily(rows);
    await publishTotals();
    expect(await getDailyForApp(appIdA)).toEqual({ data: rows, metadata });
  });

  it("returns null only for an app absent from the published dataset", async () => {
    await publishTotals();
    expect(await getTotalsForApp(appIdB)).toBeNull();
  });

  it("reports an unpublished dataset as unavailable", async () => {
    expect(await getAnalyticsSnapshotMetadata("total")).toBeNull();
    await expect(getTotalsForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisUnavailableError,
    );
  });

  it("reports a missing published row as incomplete data", async () => {
    const metadata = await publishTotals();
    await redis.del(
      analyticsRedisKeys.data("total", appIdA, metadata.snapshotId),
    );
    await expect(getTotalsForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
  });

  it("does not treat missing membership as an absent app", async () => {
    const metadata = await publishTotals();
    await redis.del(analyticsRedisKeys.apps("total", metadata.snapshotId));
    await expect(getTotalsForApp(appIdB)).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
  });

  it.each([
    ["malformed JSON", "{"],
    ["wrong app", JSON.stringify(makeTotals({ appId: appIdB }))],
    [
      "invalid metric",
      JSON.stringify(makeTotals({ n_proof_shared_sessions: -1 })),
    ],
  ])("rejects a totals value with %s", async (_label, raw) => {
    const metadata = await publishTotals();
    await redis.set(
      analyticsRedisKeys.data("total", appIdA, metadata.snapshotId),
      raw,
    );
    await expect(getTotalsForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
  });

  it.each([
    ["non-array", makeDaily()],
    ["empty array", []],
    ["wrong app", [makeDaily({ appId: appIdB })]],
    ["invalid day", [makeDaily({ day: "2026-02-30" })]],
    ["duplicate day/OS", [makeDaily(), makeDaily()]],
  ])("rejects daily data with %s", async (_label, value) => {
    const metadata = await publishDaily();
    await redis.set(
      analyticsRedisKeys.data("daily", appIdA, metadata.snapshotId),
      JSON.stringify(value),
    );
    await expect(getDailyForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
  });

  it.each([
    { schemaVersion: 2 },
    { dataset: "daily" },
    { appCount: 0 },
    { loadedAt: "invalid" },
    { source: {} },
  ])("rejects incompatible or corrupt metadata: %j", async (overrides) => {
    const metadata = await publishTotals();
    await redis.set(
      analyticsRedisKeys.metadata("total"),
      JSON.stringify({ ...metadata, ...overrides }),
    );
    await expect(getTotalsForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
  });

  it("rejects invalid lookup IDs before touching Redis", async () => {
    const get = jest.spyOn(redis, "get");
    await expect(getTotalsForApp("other-app")).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("reports an unconfigured client as unavailable", async () => {
    global.RedisClient = undefined;
    await expect(getTotalsForApp(appIdA)).rejects.toBeInstanceOf(
      AnalyticsRedisUnavailableError,
    );
  });

  it("preserves a Redis failure as the cause of an unavailable error", async () => {
    const cause = new Error("connection refused");
    jest.spyOn(redis, "get").mockRejectedValueOnce(cause);
    await expect(getTotalsForApp(appIdA)).rejects.toMatchObject({
      name: "AnalyticsRedisUnavailableError",
      cause,
    });
  });
});
// #endregion

// #region Refresh lease ownership
describe("analytics Redis snapshots [locks]", () => {
  it("excludes competing writers for one dataset while allowing the other", async () => {
    const total = await acquire();
    expect(await tryAcquireAnalyticsRefreshLock("total")).toBeNull();
    expect(await tryAcquireAnalyticsRefreshLock("daily")).not.toBeNull();
    expect(
      await redis.pttl(analyticsRedisKeys.refreshLock("total")),
    ).toBeGreaterThan(0);
    expect(await releaseAnalyticsRefreshLock(total)).toBe(true);
    expect(await tryAcquireAnalyticsRefreshLock("total")).not.toBeNull();
  });

  it("prevents an expired owner from releasing or publishing through a replacement lease", async () => {
    const expired = await acquire();
    await redis.pexpire(analyticsRedisKeys.refreshLock("total"), -1);
    const current = await acquire();
    expect(current.owner).not.toBe(expired.owner);
    expect(await releaseAnalyticsRefreshLock(expired)).toBe(false);
    await expect(publishTotals({ lock: expired })).rejects.toBeInstanceOf(
      AnalyticsSnapshotConflictError,
    );
    expect(await redis.get(analyticsRedisKeys.refreshLock("total"))).toBe(
      current.owner,
    );
  });

  it("rejects a lock belonging to a different dataset", async () => {
    await expect(
      publishTotals({ lock: await acquire("daily") }),
    ).rejects.toBeInstanceOf(AnalyticsSnapshotConflictError);
  });
});
// #endregion

// #region Publication and visibility
describe("analytics Redis snapshots [publication]", () => {
  it("changes the active snapshot and removes absent apps from reads without deleting the old version", async () => {
    const previous = await publishTotals({
      rows: [makeTotals(), makeTotals({ appId: appIdB })],
    });
    const current = await publishTotals({
      rows: [makeTotals({ n_proof_shared_sessions: 20 })],
    });
    expect(current.snapshotId).not.toBe(previous.snapshotId);
    expect((await getTotalsForApp(appIdA))?.data.n_proof_shared_sessions).toBe(
      20,
    );
    expect(await getTotalsForApp(appIdB)).toBeNull();
    expect(
      await redis.get(
        analyticsRedisKeys.data("total", appIdB, previous.snapshotId),
      ),
    ).not.toBeNull();
  });

  it("serves the previous snapshot throughout staging", async () => {
    const previous = await publishTotals();
    const originalSet = redis.set.bind(redis);
    const observations: unknown[] = [];
    jest
      .spyOn(redis, "set")
      .mockImplementation(async (...args: Parameters<typeof redis.set>) => {
        if (String(args[0]).includes(":row:"))
          observations.push(await getTotalsForApp(appIdA));
        return originalSet(...args);
      });
    await publishTotals({
      rows: [makeTotals({ n_proof_shared_sessions: 20 })],
    });
    expect(observations).toEqual([{ data: makeTotals(), metadata: previous }]);
  });

  it("reads a captured snapshot consistently when publication occurs between the two GETs", async () => {
    const previous = await publishTotals();
    const originalGet = redis.get.bind(redis);
    let switched = false;
    jest.spyOn(redis, "get").mockImplementation(async (key) => {
      const raw = await originalGet(key);
      if (key === analyticsRedisKeys.metadata("total") && !switched) {
        switched = true;
        await publishTotals({
          rows: [makeTotals({ n_proof_shared_sessions: 20 })],
        });
      }
      return raw;
    });
    expect(await getTotalsForApp(appIdA)).toEqual({
      data: makeTotals(),
      metadata: previous,
    });
    expect((await getTotalsForApp(appIdA))?.data.n_proof_shared_sessions).toBe(
      20,
    );
  });

  it.each([
    { dataAsOf: new Date("2026-09-03T21:00:00.000Z") },
    { lastModified: new Date("2026-09-03T22:00:30.000Z") },
  ])(
    "rejects a source older than the active snapshot: %j",
    async (overrides) => {
      const previous = await publishTotals();
      await expect(
        publishTotals({ source: makeSource(overrides) }),
      ).rejects.toBeInstanceOf(AnalyticsSnapshotConflictError);
      expect(await getAnalyticsSnapshotMetadata("total")).toEqual(previous);
    },
  );

  it("accepts a newer revision of the same export timestamp", async () => {
    await publishTotals();
    const current = await publishTotals({
      source: makeSource({
        etag: '"etag-2"',
        identity: 'total/data_20260903_220000.csv:"etag-2"',
        lastModified: new Date("2026-09-03T22:02:00.000Z"),
      }),
    });
    expect((await getAnalyticsSnapshotMetadata("total"))?.source.identity).toBe(
      current.source.identity,
    );
  });

  it("rejects empty snapshots and validates every row before writing data", async () => {
    const lock = await acquire();
    await expect(publishTotals({ rows: [], lock })).rejects.toBeInstanceOf(
      AnalyticsRedisDataError,
    );
    const set = jest.spyOn(redis, "set");
    await expect(
      publishTotals({
        lock,
        rows: [
          makeTotals(),
          makeTotals({ appId: appIdB, n_proof_shared_sessions: -1 }),
        ],
      }),
    ).rejects.toBeInstanceOf(AnalyticsRedisDataError);
    expect(set).not.toHaveBeenCalled();
    expect(await getAnalyticsSnapshotMetadata("total")).toBeNull();
  });

  it("rejects invalid source dates before writing rows", async () => {
    const lock = await acquire();
    const set = jest.spyOn(redis, "set");
    await expect(
      publishTotals({
        lock,
        source: makeSource({ dataAsOf: new Date("invalid") }),
      }),
    ).rejects.toBeInstanceOf(AnalyticsRedisDataError);
    expect(set).not.toHaveBeenCalled();
  });

  it("preserves the active snapshot after a partial row write failure", async () => {
    const previous = await publishTotals();
    const originalSet = redis.set.bind(redis);
    jest
      .spyOn(redis, "set")
      .mockImplementation(async (...args: Parameters<typeof redis.set>) => {
        if (String(args[0]).includes(`:${appIdB}:`))
          throw new Error("Redis write failed");
        return originalSet(...args);
      });
    await expect(
      publishTotals({
        rows: [
          makeTotals({ n_proof_shared_sessions: 20 }),
          makeTotals({ appId: appIdB }),
        ],
      }),
    ).rejects.toBeInstanceOf(AnalyticsRedisUnavailableError);
    expect(await getTotalsForApp(appIdA)).toEqual({
      data: makeTotals(),
      metadata: previous,
    });
  });

  it("does not publish if membership could not be written", async () => {
    jest.spyOn(redis, "sadd").mockRejectedValueOnce(new Error("write failed"));
    await expect(publishTotals()).rejects.toBeInstanceOf(
      AnalyticsRedisUnavailableError,
    );
    expect(await getAnalyticsSnapshotMetadata("total")).toBeNull();
  });

  it("rechecks ownership at publication after the lease expires during staging", async () => {
    const previous = await publishTotals();
    const lock = await acquire();
    const originalSet = redis.set.bind(redis);
    jest
      .spyOn(redis, "set")
      .mockImplementation(async (...args: Parameters<typeof redis.set>) => {
        const result = await originalSet(...args);
        if (String(args[0]).includes(":row:"))
          await redis.pexpire(analyticsRedisKeys.refreshLock("total"), -1);
        return result;
      });
    await expect(publishTotals({ lock })).rejects.toBeInstanceOf(
      AnalyticsSnapshotConflictError,
    );
    expect(await getAnalyticsSnapshotMetadata("total")).toEqual(previous);
  });

  it("rejects publication when active metadata changes during staging", async () => {
    const previous = await publishTotals();
    const replacement = {
      ...previous,
      lastCheckedAt: "2026-09-04T00:00:00.000Z",
    };
    const originalSet = redis.set.bind(redis);
    jest
      .spyOn(redis, "set")
      .mockImplementation(async (...args: Parameters<typeof redis.set>) => {
        const result = await originalSet(...args);
        if (String(args[0]).includes(":row:"))
          await originalSet(
            analyticsRedisKeys.metadata("total"),
            JSON.stringify(replacement),
          );
        return result;
      });
    await expect(publishTotals()).rejects.toBeInstanceOf(
      AnalyticsSnapshotConflictError,
    );
    expect(await getAnalyticsSnapshotMetadata("total")).toEqual(replacement);
  });

  it("uses unique staging keys when an expired writer overlaps a replacement writer for the same S3 object", async () => {
    const expired = await acquire();
    const originalSet = redis.set.bind(redis);
    let replacement;
    let replaced = false;
    jest
      .spyOn(redis, "set")
      .mockImplementation(async (...args: Parameters<typeof redis.set>) => {
        if (String(args[0]).includes(":row:") && !replaced) {
          replaced = true;
          await redis.pexpire(analyticsRedisKeys.refreshLock("total"), -1);
          replacement = await publishTotals({
            rows: [makeTotals({ n_proof_shared_sessions: 20 })],
          });
        }
        return originalSet(...args);
      });
    await expect(publishTotals({ lock: expired })).rejects.toBeInstanceOf(
      AnalyticsSnapshotConflictError,
    );
    expect(await getTotalsForApp(appIdA)).toEqual({
      data: makeTotals({ n_proof_shared_sessions: 20 }),
      metadata: replacement,
    });
  });
});
// #endregion
