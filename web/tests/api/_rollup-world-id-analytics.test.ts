import { POST } from "@/api/_rollup-world-id-analytics";
import { NextRequest } from "next/server";
import { makeRollupOperationResult } from "../contracts/world-id-analytics-graphql";

// #region Mocks
const rollupOperation = jest.fn();
const earliestOperation = jest.fn();
const getAPIServiceGraphqlClient = jest.fn().mockResolvedValue({});
const loggerInfo = jest.fn();
const loggerWarn = jest.fn();
const loggerError = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfo(...args),
    warn: (...args: unknown[]) => loggerWarn(...args),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: (...args: unknown[]) =>
    getAPIServiceGraphqlClient(...args),
}));

jest.mock(
  "../../api/_rollup-world-id-analytics/graphql/rollup-world-id-analytics.generated",
  () => ({
    getSdk: () => ({
      RollupWorldIdAnalytics: (...args: unknown[]) => rollupOperation(...args),
    }),
  }),
  { virtual: true },
);

jest.mock(
  "../../api/_rollup-world-id-analytics/graphql/get-earliest-nullifiers.generated",
  () => ({
    getSdk: () => ({
      GetEarliestNullifiers: (...args: unknown[]) => earliestOperation(...args),
    }),
  }),
  { virtual: true },
);
// #endregion

// #region Test Data
const secret = "analytics-contract-secret";
const CURSOR_KEY = "world-id-analytics:rollup:processed-through";

const request = (authorization: string | null = secret) =>
  new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
    body: JSON.stringify({}),
  });

const redis = () => global.RedisClient!;

// Frozen clock: "now" is 2026-01-15T12:00:00Z, so yesterday is 2026-01-14.
let nowMs: number;
const YESTERDAY = "2026-01-14";
// #endregion

beforeEach(async () => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = secret;
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
  rollupOperation.mockResolvedValue(makeRollupOperationResult());
  earliestOperation.mockResolvedValue({ nullifier: [], nullifier_v4: [] });
  await redis().flushall();
  nowMs = Date.UTC(2026, 0, 15, 12);
  jest.spyOn(Date, "now").mockImplementation(() => nowMs);
});

afterEach(() => {
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
  jest.restoreAllMocks();
});

// #region Authentication
describe("POST _rollup-world-id-analytics [authentication]", () => {
  it.each([null, "wrong-secret"])(
    "rejects an unauthenticated request",
    async (authorization) => {
      const response = await POST(request(authorization));

      expect(response.status).toBe(403);
      expect(rollupOperation).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Rollout gate
describe("POST _rollup-world-id-analytics [rollout gate]", () => {
  it("skips the database when the rollout gate is unset", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      outcome: "disabled",
    });
    expect(getAPIServiceGraphqlClient).not.toHaveBeenCalled();
    expect(rollupOperation).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Trailing window
describe("POST _rollup-world-id-analytics [trailing window]", () => {
  it("rebuilds the trailing window before touching the backfill", async () => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
    await redis().set(CURSOR_KEY, YESTERDAY);
    rollupOperation.mockResolvedValue(
      makeRollupOperationResult([
        { date_utc: "2026-01-14", unique_count: "3" },
        { date_utc: "2026-01-15", unique_count: "4" },
      ]),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      outcome: "advanced",
      days: 2,
      total: "7",
      backfill: { chunks: 0, complete: true, processed_through: YESTERDAY },
    });
    expect(rollupOperation).toHaveBeenCalledTimes(1);
    expect(rollupOperation).toHaveBeenCalledWith({
      from_date: null,
      to_date: null,
    });
    expect(earliestOperation).not.toHaveBeenCalled();
    expect(loggerInfo).toHaveBeenCalledWith(
      "Rolled up World ID analytics",
      expect.objectContaining({ outcome: "advanced", days: 2, total: "7" }),
    );
  });

  it("returns 500 when the trailing rebuild fails", async () => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
    rollupOperation.mockRejectedValue(new Error("connection reset"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "connection reset",
    });
    expect(loggerError).toHaveBeenCalledWith(
      "Error rolling up World ID analytics",
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
// #endregion

// #region Backfill catch-up
describe("POST _rollup-world-id-analytics [backfill catch-up]", () => {
  beforeEach(() => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
  });

  it("bootstraps from the earliest raw row and chunks up to yesterday", async () => {
    earliestOperation.mockResolvedValue({
      nullifier: [{ created_at: "2026-01-05T08:00:00+00:00" }],
      nullifier_v4: [{ created_at: "2026-01-03T02:00:00+00:00" }],
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      outcome: "advanced",
      backfill: { chunks: 2, complete: true, processed_through: YESTERDAY },
    });
    expect(rollupOperation.mock.calls.map(([variables]) => variables)).toEqual([
      { from_date: null, to_date: null },
      { from_date: "2026-01-03", to_date: "2026-01-12" },
      { from_date: "2026-01-13", to_date: "2026-01-14" },
    ]);
    // One fresh client per operation: the service JWT only lives one minute.
    expect(getAPIServiceGraphqlClient).toHaveBeenCalledTimes(4);
    expect(await redis().get(CURSOR_KEY)).toBe(YESTERDAY);
    expect(await redis().ttl(CURSOR_KEY)).toBe(2 * 24 * 60 * 60);
  });

  it("resumes from the stored cursor without re-querying the earliest row", async () => {
    await redis().set(CURSOR_KEY, "2026-01-09");

    const response = await POST(request());

    expect(await response.json()).toMatchObject({
      backfill: { chunks: 1, complete: true, processed_through: YESTERDAY },
    });
    expect(rollupOperation.mock.calls.map(([variables]) => variables)).toEqual([
      { from_date: null, to_date: null },
      { from_date: "2026-01-10", to_date: "2026-01-14" },
    ]);
    expect(earliestOperation).not.toHaveBeenCalled();
  });

  it("completes immediately when there are no raw rows at all", async () => {
    const response = await POST(request());

    expect(await response.json()).toMatchObject({
      success: true,
      backfill: { chunks: 0, complete: true, processed_through: YESTERDAY },
    });
    expect(rollupOperation).toHaveBeenCalledTimes(1);
    expect(await redis().get(CURSOR_KEY)).toBe(YESTERDAY);
  });

  it("stops at the failed chunk, keeps the cursor behind it, and 500s", async () => {
    await redis().set(CURSOR_KEY, "2026-01-02");
    rollupOperation.mockImplementation(
      (variables: { from_date: string | null }) =>
        variables.from_date === "2026-01-13"
          ? Promise.reject(new Error("statement timeout"))
          : Promise.resolve(makeRollupOperationResult()),
    );

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "statement timeout",
      backfill: {
        chunks: 1,
        complete: false,
        processed_through: "2026-01-12",
        failed_range: {
          from_date: "2026-01-13",
          to_date: "2026-01-14",
          error: "statement timeout",
        },
      },
    });
    expect(await redis().get(CURSOR_KEY)).toBe("2026-01-12");
    expect(loggerError).toHaveBeenCalledWith(
      "World ID analytics backfill chunk failed",
      expect.objectContaining({ from_date: "2026-01-13" }),
    );
  });

  it("stops starting chunks once the time budget is spent", async () => {
    await redis().set(CURSOR_KEY, "2025-11-01");
    rollupOperation.mockImplementation(
      (variables: { from_date: string | null }) => {
        // Each chunk burns seven minutes of the twelve-minute budget.
        if (variables.from_date !== null) nowMs += 7 * 60 * 1000;
        return Promise.resolve(makeRollupOperationResult());
      },
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      backfill: {
        chunks: 2,
        complete: false,
        processed_through: "2025-11-21",
      },
    });
    // Trailing window plus exactly two chunks before the cutoff.
    expect(rollupOperation).toHaveBeenCalledTimes(3);
  });

  it("skips the backfill when Redis is unavailable", async () => {
    const client = global.RedisClient;
    global.RedisClient = undefined;

    try {
      const response = await POST(request());

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        outcome: "advanced",
        backfill: {
          chunks: 0,
          complete: false,
          processed_through: null,
          skipped: "redis_unavailable",
        },
      });
      expect(rollupOperation).toHaveBeenCalledTimes(1);
      expect(loggerWarn).toHaveBeenCalledWith(
        "World ID analytics backfill skipped — Redis unavailable",
      );
    } finally {
      global.RedisClient = client;
    }
  });
});
// #endregion
