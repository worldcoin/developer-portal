import { POST } from "@/api/_rollup-world-id-analytics";
import { NextRequest } from "next/server";
import { makeRollupOperationResult } from "../contracts/world-id-analytics-graphql";

// #region Mocks
const databaseOperation = jest.fn();
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
    getSdk: () =>
      new Proxy(
        {},
        {
          get: () => databaseOperation,
        },
      ),
  }),
  { virtual: true },
);
// #endregion

// #region Test Data
const secret = "analytics-contract-secret";

const request = (body?: unknown, authorization: string | null = secret) =>
  new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = secret;
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
  databaseOperation.mockResolvedValue(makeRollupOperationResult());
});

afterEach(() => {
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
});

// #region Authentication
describe("POST _rollup-world-id-analytics [authentication]", () => {
  it.each([null, "wrong-secret"])(
    "rejects an unauthenticated request",
    async (authorization) => {
      const response = await POST(request(undefined, authorization));

      expect(response.status).toBe(403);
      expect(databaseOperation).not.toHaveBeenCalled();
    },
  );
});
// #endregion

// #region Cron mode
describe("POST _rollup-world-id-analytics [cron mode]", () => {
  it("skips the database when the rollout gate is unset", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      outcome: "disabled",
    });
    expect(getAPIServiceGraphqlClient).not.toHaveBeenCalled();
    expect(databaseOperation).not.toHaveBeenCalled();
  });

  it("rebuilds the default trailing window when enabled", async () => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
    databaseOperation.mockResolvedValue(
      makeRollupOperationResult([
        { date_utc: "2026-08-04", unique_count: "3" },
        { date_utc: "2026-08-05", unique_count: "4" },
      ]),
    );

    const response = await POST(request({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      outcome: "advanced",
      days: 2,
      total: "7",
    });
    expect(databaseOperation).toHaveBeenCalledTimes(1);
    expect(databaseOperation).toHaveBeenCalledWith({
      from_date: null,
      to_date: null,
    });
    expect(loggerInfo).toHaveBeenCalledWith(
      "Rolled up World ID analytics",
      expect.objectContaining({ outcome: "advanced", days: 2, total: "7" }),
    );
  });

  it("returns 500 when the database operation fails", async () => {
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
    databaseOperation.mockRejectedValue(new Error("connection reset"));

    const response = await POST(request({}));

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

// #region Dated mode
describe("POST _rollup-world-id-analytics [dated mode]", () => {
  it("splits the range into inclusive chunks and bypasses the rollout gate", async () => {
    const response = await POST(
      request({
        from_date: "2026-01-01",
        to_date: "2026-01-25",
        chunk_days: 10,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      chunks: 3,
      failed_ranges: [],
    });
    expect(
      databaseOperation.mock.calls.map(([variables]) => variables),
    ).toEqual([
      { from_date: "2026-01-01", to_date: "2026-01-10" },
      { from_date: "2026-01-11", to_date: "2026-01-20" },
      { from_date: "2026-01-21", to_date: "2026-01-25" },
    ]);
    // One fresh client per chunk: the service JWT only lives one minute.
    expect(getAPIServiceGraphqlClient).toHaveBeenCalledTimes(3);
  });

  it("collects a failed chunk and keeps processing the rest", async () => {
    databaseOperation.mockImplementation((variables: { from_date: string }) => {
      if (variables.from_date === "2026-01-11") {
        return Promise.reject(new Error("statement timeout"));
      }
      return Promise.resolve(makeRollupOperationResult());
    });

    const response = await POST(
      request({
        from_date: "2026-01-01",
        to_date: "2026-01-25",
        chunk_days: 10,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: false,
      chunks: 3,
      failed_ranges: [
        {
          from_date: "2026-01-11",
          to_date: "2026-01-20",
          error: "statement timeout",
        },
      ],
    });
    expect(databaseOperation).toHaveBeenCalledTimes(3);
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "a missing to_date",
      { from_date: "2026-01-01" },
      "from_date and to_date must both be set",
    ],
    [
      "a malformed date",
      { from_date: "2026-1-1", to_date: "2026-01-05" },
      "from_date must be a valid YYYY-MM-DD date",
    ],
    [
      "an impossible date",
      { from_date: "2026-02-30", to_date: "2026-03-05" },
      "from_date must be a valid YYYY-MM-DD date",
    ],
    [
      "a reversed range",
      { from_date: "2026-01-10", to_date: "2026-01-01" },
      "from_date must not be after to_date",
    ],
    [
      "a range wider than one call may take",
      { from_date: "2026-01-01", to_date: "2026-05-01" },
      "range must be at most 92 days per call; split it",
    ],
    [
      "a non-positive chunk size",
      { from_date: "2026-01-01", to_date: "2026-01-05", chunk_days: 0 },
      "chunk_days must be an integer between 1 and 31",
    ],
  ])("rejects %s without touching the database", async (_case, body, error) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, error });
    expect(databaseOperation).not.toHaveBeenCalled();
  });
});
// #endregion
