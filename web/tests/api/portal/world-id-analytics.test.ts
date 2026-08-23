import { GET } from "@/api/portal/apps/[app_id]/world-id-analytics";
import { NextRequest } from "next/server";
import {
  makeActionDailyResult,
  makeAnalyticsScopeResult,
  makeAppDailyResult,
  type AnalyticsScopeInput,
} from "../../contracts/world-id-analytics-graphql";
import { normalizeAnalyticsResponse } from "../../contracts/world-id-analytics-endpoint";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();
const databaseOperation = jest.fn();
const scopeRead = jest.fn();
const appDailyRead = jest.fn();
const actionDailyRead = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));

jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-world-id-analytics.generated",
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
const appId = "app_00000000000000000000000000000001";
const otherAppId = "app_00000000000000000000000000000002";
const legacyActionId = "action_000000000000000000000000000001";
const v4ActionId = "action_v4_0000000000000000000000000001";

const makeRequest = (query = "environment=production&period=last_7_days") =>
  new NextRequest(
    `http://localhost:3000/api/portal/apps/${appId}/world-id-analytics?${query}`,
  );

const context = { params: Promise.resolve({ app_id: appId }) };

const call = (query?: string) => GET(makeRequest(query), context);

const setSuccessfulReads = (input: AnalyticsScopeInput = {}) => {
  scopeRead.mockResolvedValue(makeAnalyticsScopeResult(appId, input));
  appDailyRead.mockResolvedValue(makeAppDailyResult());
  actionDailyRead.mockResolvedValue(makeActionDailyResult());
};

const bodyOf = async (response: Response) =>
  normalizeAnalyticsResponse(await response.json());
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-07-30T12:00:00.000Z"));
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  setSuccessfulReads();
  databaseOperation.mockImplementation((variables: unknown) => {
    if (databaseOperation.mock.calls.length === 1) {
      return scopeRead(variables);
    }
    if (
      variables &&
      typeof variables === "object" &&
      Object.values(variables).some(Array.isArray)
    ) {
      return actionDailyRead(variables);
    }
    return appDailyRead(variables);
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// #region Authorization and validation
describe("GET world-id-analytics [authorization and validation]", () => {
  it("returns 404 on authorization denial without reading analytics", async () => {
    getIsUserAllowedToReadApp.mockResolvedValue(false);

    const response = await call();

    expect(response.status).toBe(404);
    expect(databaseOperation).not.toHaveBeenCalled();
  });

  it("returns 404 for a soft-deleted or absent app", async () => {
    setSuccessfulReads({ app: null });

    const response = await call();

    expect(response.status).toBe(404);
    expect(databaseOperation).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["missing environment", "period=last_7_days"],
    ["unknown environment", "environment=preview&period=last_7_days"],
    ["missing period", "environment=production"],
    ["unknown period", "environment=production&period=yesterday"],
    [
      "an empty action id",
      "environment=production&period=last_7_days&action_ids=action_1,,action_2",
    ],
    [
      "a duplicate action id",
      `environment=production&period=last_7_days&action_ids=${legacyActionId},${legacyActionId}`,
    ],
    [
      "more than twelve action ids",
      `environment=production&period=last_7_days&action_ids=${Array.from(
        { length: 13 },
        (_, index) => `action_${index.toString().padStart(32, "0")}`,
      ).join(",")}`,
    ],
  ])("rejects %s before any analytics read", async (_name, query) => {
    const response = await call(query);

    expect(response.status).toBe(400);
    expect(databaseOperation).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Requested action ownership
describe("GET world-id-analytics [requested action ownership]", () => {
  it.each([
    [
      "unknown",
      "action_000000000000000000000000000099",
      { legacyActions: [], actions: [] },
    ],
    [
      "another app",
      legacyActionId,
      {
        legacyActions: [
          { id: legacyActionId, app_id: otherAppId, created_at: "2026-07-20" },
        ],
      },
    ],
    [
      "another environment",
      v4ActionId,
      {
        actions: [
          {
            id: v4ActionId,
            app_id: appId,
            environment: "staging",
            created_at: "2026-07-20",
          },
        ],
      },
    ],
    [
      "another app's RP registration",
      v4ActionId,
      {
        actions: [
          {
            id: v4ActionId,
            app_id: otherAppId,
            environment: "production",
            created_at: "2026-07-20",
          },
        ],
      },
    ],
  ] as const)(
    "rejects an action from %s",
    async (_case, requestedId, scope) => {
      setSuccessfulReads(scope);

      const response = await call(
        `environment=production&period=last_7_days&action_ids=${requestedId}`,
      );

      expect(response.status).toBe(400);
      expect(appDailyRead).not.toHaveBeenCalled();
    },
  );

  it("rejects an id resolved from the wrong source table", async () => {
    setSuccessfulReads({
      legacyActions: [],
      actions: [
        {
          id: legacyActionId,
          app_id: appId,
          environment: "production",
          created_at: "2026-07-20",
        },
      ],
    });

    const response = await call(
      `environment=production&period=last_7_days&action_ids=${legacyActionId}`,
    );

    expect(response.status).toBe(400);
    expect(appDailyRead).not.toHaveBeenCalled();
  });

  it("rejects a legacy action when the app maps to staging", async () => {
    setSuccessfulReads({
      app: { is_staging: true },
      legacyActions: [
        {
          id: legacyActionId,
          app_id: appId,
          created_at: "2026-07-20",
        },
      ],
    });

    const response = await call(
      `environment=production&period=last_7_days&action_ids=${legacyActionId}`,
    );

    expect(response.status).toBe(400);
  });

  it("rejects an id that resolves ambiguously in both sources", async () => {
    setSuccessfulReads({
      legacyActions: [
        {
          id: legacyActionId,
          app_id: appId,
          created_at: "2026-07-20",
        },
      ],
      actions: [
        {
          id: legacyActionId,
          app_id: appId,
          environment: "production",
          created_at: "2026-07-20",
        },
      ],
    });

    expect(
      (
        await call(
          `environment=production&period=last_7_days&action_ids=${legacyActionId}`,
        )
      ).status,
    ).toBe(400);
  });
});
// #endregion

// #region Last 7 Days behavior
describe("GET world-id-analytics [Last 7 Days]", () => {
  it("zero-fills from a young app creation date and sums database rows", async () => {
    setSuccessfulReads({ app: { created_at: "2026-07-28T23:59:59.000Z" } });
    appDailyRead.mockResolvedValue(
      makeAppDailyResult([
        { date_utc: "2026-07-28", unique_count: "2" },
        { date_utc: "2026-07-30", unique_count: "5" },
      ]),
    );

    const response = await call();
    const body = await bodyOf(response);

    expect(response.status).toBe(200);
    expect(body.app).toEqual({
      count: "7",
      series: [
        { date: "2026-07-28", count: "2" },
        { date: "2026-07-29", count: "0" },
        { date: "2026-07-30", count: "5" },
      ],
    });
  });

  it("returns only the requested source-specific action blocks", async () => {
    setSuccessfulReads({
      legacyActions: [
        {
          id: legacyActionId,
          app_id: appId,
          created_at: "2026-07-28T23:30:00.000Z",
        },
      ],
      actions: [
        {
          id: v4ActionId,
          app_id: appId,
          environment: "production",
          created_at: "2026-07-27T01:00:00.000Z",
        },
      ],
    });
    appDailyRead.mockResolvedValue(
      makeAppDailyResult([{ date_utc: "2026-07-30", unique_count: "20" }]),
    );
    actionDailyRead.mockResolvedValue(
      makeActionDailyResult({
        legacy: [
          {
            action_id: legacyActionId,
            date_utc: "2026-07-29",
            unique_count: "2",
          },
        ],
        v4: [
          {
            action_v4_id: v4ActionId,
            date_utc: "2026-07-30",
            unique_count: "3",
          },
        ],
      }),
    );

    const body = await bodyOf(
      await call(
        `environment=production&period=last_7_days&action_ids=${legacyActionId},${v4ActionId}`,
      ),
    );

    expect(body.app.count).toBe("20");
    expect(body.legacyActions).toEqual([
      expect.objectContaining({ id: legacyActionId, count: "2" }),
    ]);
    expect(body.actions).toEqual([
      expect.objectContaining({ id: v4ActionId, count: "3" }),
    ]);
    expect(body.legacyActions[0].series).toEqual([
      { date: "2026-07-28", count: "0" },
      { date: "2026-07-29", count: "2" },
      { date: "2026-07-30", count: "0" },
    ]);
  });

  it("keeps app aggregation independent of requested action ids", async () => {
    setSuccessfulReads({
      legacyActions: [
        {
          id: legacyActionId,
          app_id: appId,
          created_at: "2026-07-20",
        },
      ],
    });
    appDailyRead.mockResolvedValue(
      makeAppDailyResult([{ date_utc: "2026-07-30", unique_count: "42" }]),
    );
    actionDailyRead.mockResolvedValue(
      makeActionDailyResult({
        legacy: [
          {
            action_id: legacyActionId,
            date_utc: "2026-07-30",
            unique_count: "5",
          },
        ],
      }),
    );

    const body = await bodyOf(
      await call(
        `environment=production&period=last_7_days&action_ids=${legacyActionId}`,
      ),
    );

    expect(body.app.count).toBe("42");
    expect(body.legacyActions[0].count).toBe("5");
  });

  it("preserves counts above Number.MAX_SAFE_INTEGER", async () => {
    appDailyRead.mockResolvedValue(
      makeAppDailyResult([
        { date_utc: "2026-07-29", unique_count: "9007199254740993" },
        { date_utc: "2026-07-30", unique_count: "9" },
      ]),
    );

    const body = await bodyOf(await call());

    expect(body.app.count).toBe("9007199254741002");
    expect(body.app.series.at(-2)).toEqual({
      date: "2026-07-29",
      count: "9007199254740993",
    });
  });

  it("returns a flat seven-day zero series for an old empty scope", async () => {
    const body = await bodyOf(await call());

    expect(body.app.count).toBe("0");
    expect(body.app.series).toHaveLength(7);
    expect(body.app.series.every((point) => point.count === "0")).toBe(true);
  });
});
// #endregion

// #region All Time behavior
describe("GET world-id-analytics [All Time]", () => {
  it("starts at app creation when the environment has legacy history", async () => {
    setSuccessfulReads({
      app: {
        created_at: "2026-07-20T23:59:59.000Z",
        rp_registration: [{ created_at: "2026-07-25T00:00:00.000Z" }],
      },
      hasLegacyHistory: true,
    });

    const body = await bodyOf(
      await call("environment=production&period=all_time"),
    );

    expect(body.app.series[0].date).toBe("2026-07-20");
  });

  it("starts a v4-only app at RP registration without pre-RP zeros", async () => {
    setSuccessfulReads({
      app: {
        created_at: "2026-07-20T00:00:00.000Z",
        rp_registration: [{ created_at: "2026-07-25T23:59:59.000Z" }],
      },
      hasLegacyHistory: false,
    });

    const body = await bodyOf(
      await call("environment=production&period=all_time"),
    );

    expect(body.app.series[0].date).toBe("2026-07-25");
    expect(body.app.series.some((point) => point.date === "2026-07-24")).toBe(
      false,
    );
  });

  it("starts each requested action at its own source creation date", async () => {
    setSuccessfulReads({
      actions: [
        {
          id: v4ActionId,
          app_id: appId,
          environment: "production",
          created_at: "2026-07-29T23:59:59.000Z",
        },
      ],
    });
    actionDailyRead.mockResolvedValue(
      makeActionDailyResult({
        v4: [
          {
            action_v4_id: v4ActionId,
            date_utc: "2026-07-30",
            unique_count: "2",
          },
        ],
      }),
    );

    const body = await bodyOf(
      await call(
        `environment=production&period=all_time&action_ids=${v4ActionId}`,
      ),
    );

    expect(body.app.series[0].date).toBe("2026-07-20");
    expect(body.actions[0]).toEqual({
      id: v4ActionId,
      count: "2",
      series: [
        { date: "2026-07-29", count: "0" },
        { date: "2026-07-30", count: "2" },
      ],
    });
  });
});
// #endregion

// #region Response exclusions and failures
describe("GET world-id-analytics [response semantics]", () => {
  it("does not expose retired metrics or source breakdowns", async () => {
    const response = await call();
    const json = JSON.stringify(await response.json());

    expect(json).not.toMatch(
      /session|team|reuse|uses|latest|stale|watermark|human/i,
    );
    expect(normalizeAnalyticsResponse(JSON.parse(json)).app.count).toBe("0");
  });

  it("returns 500 instead of partial data when an analytics read fails", async () => {
    appDailyRead.mockRejectedValue(new Error("database unavailable"));

    const response = await call();

    expect(response.status).toBe(500);
  });
});
// #endregion
