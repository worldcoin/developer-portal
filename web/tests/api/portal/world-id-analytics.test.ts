import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { GET } from "@/api/portal/apps/[app_id]/world-id-analytics";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import type { GraphQLClient } from "graphql-request";
import { NextRequest } from "next/server";

// #region Mocks
const GetWorldIdAnalyticsActionDailies = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-action-dailies.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsActionDailies }),
  }),
);

const GetWorldIdAnalyticsActionTotal = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-action-total.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsActionTotal }),
  }),
);

const GetWorldIdAnalyticsAppDailies = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-app-dailies.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsAppDailies }),
  }),
);

const GetWorldIdAnalyticsAppTotal = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-app-total.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsAppTotal }),
  }),
);

const GetWorldIdAnalyticsLegacyAction = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-legacy-action.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsLegacyAction }),
  }),
);

const GetWorldIdAnalyticsLegacyActionsPage = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-legacy-actions-page.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsLegacyActionsPage }),
  }),
);

const GetWorldIdAnalyticsMeta = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-meta.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsMeta }),
  }),
);

const GetWorldIdAnalyticsPageActionStats = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-page-action-stats.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsPageActionStats }),
  }),
);

const GetWorldIdAnalyticsRpForApp = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-rp-for-app.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsRpForApp }),
  }),
);

const GetWorldIdAnalyticsV4Action = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-v4-action.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsV4Action }),
  }),
);

const GetWorldIdAnalyticsV4ActionsPage = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-v4-actions-page.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsV4ActionsPage }),
  }),
);

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: jest.fn(),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetIsUserAllowedToReadApp = jest.mocked(getIsUserAllowedToReadApp);
const mockGetAPIServiceGraphqlClient = jest.mocked(getAPIServiceGraphqlClient);
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const otherAppId = "app_fedcba9876543210fedcba9876543210";
const rpId = "rp_0123456789abcdef";
const v4ActionIdA = "action_v4_alpha";
const v4ActionIdB = "action_v4_beta";
const legacyActionId = "action_legacy_alpha";
const now = "2026-07-23T12:00:00.000Z";
const asOf = "2026-07-23T11:55:00.000Z";
const graphqlClient = {} as GraphQLClient;

const freshMetaRows = [
  { key: "watermark_last_until", timestamp_value: asOf },
  { key: "watermark_last_success_at", timestamp_value: now },
];

const appTotalRow = {
  verifications: 20,
  unique_verifications: 14,
  repeated_verifications: 6,
  latest_verification_at: "2026-07-23T10:30:00.000Z",
};

const weekDailyRows = [
  {
    date: "2026-07-17",
    verifications: 2,
    unique_verifications: 2,
    repeated_verifications: 0,
  },
  {
    date: "2026-07-19",
    verifications: 5,
    unique_verifications: 3,
    repeated_verifications: 2,
  },
  {
    date: "2026-07-23",
    verifications: 1,
    unique_verifications: 1,
    repeated_verifications: 0,
  },
];

const v4Actions = [
  {
    id: v4ActionIdA,
    action: "verify-alpha",
    description: "Alpha action",
    created_at: "2026-07-20T10:00:00.000Z",
  },
  {
    id: v4ActionIdB,
    action: "verify-beta",
    description: "Beta action",
    created_at: "2026-07-19T10:00:00.000Z",
  },
];

const v4ActionStats = [
  {
    action_id: v4ActionIdB,
    verifications: 7,
    unique_verifications: 4,
    repeated_verifications: 3,
    latest_verification_at: "2026-07-22T10:00:00.000Z",
  },
  {
    action_id: v4ActionIdA,
    verifications: 11,
    unique_verifications: 9,
    repeated_verifications: 2,
    latest_verification_at: "2026-07-23T10:00:00.000Z",
  },
];

const sdkMocks = [
  GetWorldIdAnalyticsActionDailies,
  GetWorldIdAnalyticsActionTotal,
  GetWorldIdAnalyticsAppDailies,
  GetWorldIdAnalyticsAppTotal,
  GetWorldIdAnalyticsLegacyAction,
  GetWorldIdAnalyticsLegacyActionsPage,
  GetWorldIdAnalyticsMeta,
  GetWorldIdAnalyticsPageActionStats,
  GetWorldIdAnalyticsRpForApp,
  GetWorldIdAnalyticsV4Action,
  GetWorldIdAnalyticsV4ActionsPage,
];

function createRequest(params: Record<string, string> = {}) {
  const url = new URL(
    `http://localhost:3000/api/portal/apps/${appId}/world-id-analytics`,
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

async function callHandler(
  params: Record<string, string> = {},
  requestAppId = appId,
) {
  const response = await GET(createRequest(params), {
    params: Promise.resolve({ app_id: requestAppId }),
  });
  return { response, body: await response.json() };
}
// #endregion

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(now));

  mockGetIsUserAllowedToReadApp.mockResolvedValue(true);
  mockGetAPIServiceGraphqlClient.mockResolvedValue(graphqlClient);
  GetWorldIdAnalyticsMeta.mockResolvedValue({
    verification_analytics_meta: freshMetaRows,
  });
  GetWorldIdAnalyticsAppTotal.mockResolvedValue({
    app_verification_stats_total_by_pk: appTotalRow,
  });
  GetWorldIdAnalyticsAppDailies.mockResolvedValue({
    app_verification_stats_daily: weekDailyRows,
  });
  GetWorldIdAnalyticsActionTotal.mockResolvedValue({
    action_verification_stats_total_by_pk: appTotalRow,
  });
  GetWorldIdAnalyticsActionDailies.mockResolvedValue({
    action_verification_stats_daily: weekDailyRows,
  });
  GetWorldIdAnalyticsRpForApp.mockResolvedValue({
    rp_registration: [{ rp_id: rpId }],
  });
  GetWorldIdAnalyticsV4ActionsPage.mockResolvedValue({
    action_v4: v4Actions,
    action_v4_aggregate: { aggregate: { count: 2 } },
  });
  GetWorldIdAnalyticsLegacyActionsPage.mockResolvedValue({
    action: [
      {
        id: legacyActionId,
        action: "legacy-alpha",
        name: "Legacy Alpha",
        created_at: "2026-07-18T10:00:00.000Z",
      },
    ],
    action_aggregate: { aggregate: { count: 1 } },
  });
  GetWorldIdAnalyticsPageActionStats.mockResolvedValue({
    action_verification_stats_total: v4ActionStats,
  });
  GetWorldIdAnalyticsV4Action.mockResolvedValue({
    action_v4_by_pk: {
      environment: "production",
      rp_registration: { app_id: appId },
    },
  });
  GetWorldIdAnalyticsLegacyAction.mockResolvedValue({
    action_by_pk: { app_id: appId },
  });
});

// #region Authorization and input validation
describe("GET /api/portal/apps/[app_id]/world-id-analytics [authorization]", () => {
  it("returns 404 without making SDK calls when app read permission is denied", async () => {
    mockGetIsUserAllowedToReadApp.mockResolvedValueOnce(false);

    const { response, body } = await callHandler();

    expect(response.status).toBe(404);
    expect(body.code).toBe("not_found");
    expect(mockGetAPIServiceGraphqlClient).not.toHaveBeenCalled();
    for (const sdkMock of sdkMocks) {
      expect(sdkMock).not.toHaveBeenCalled();
    }
  });
});

describe("GET /api/portal/apps/[app_id]/world-id-analytics [validation]", () => {
  it.each(["combined", "junk"])(
    "returns invalid_source for source=%s",
    async (source) => {
      const { response, body } = await callHandler({ source });

      expect(response.status).toBe(400);
      expect(body.code).toBe("invalid_source");
    },
  );

  it.each([
    [{ period: "month" }, "invalid_period"],
    [{ page: "0" }, "invalid_page"],
    [{ page_size: "13" }, "invalid_page_size"],
    [{ search: "x".repeat(65) }, "invalid_search"],
  ])("rejects invalid query params %p", async (params, expectedCode) => {
    const { response, body } = await callHandler(params);

    expect(response.status).toBe(400);
    expect(body.code).toBe(expectedCode);
  });
});
// #endregion

// #region Successful analytics responses
describe("GET /api/portal/apps/[app_id]/world-id-analytics [v4 week]", () => {
  it("returns app totals, a zero-filled seven-day series, coverage, and keyed action stats", async () => {
    const { response, body } = await callHandler();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      scope: "app",
      source: "v4",
      period: "week",
      as_of: asOf,
      stale: false,
      coverage: {
        lifetime_total: "lower_bound",
        reuse_included_since: null,
        daily_repeats_included_since: null,
        historical_daily_mode: "first_use_only",
        daily_precision: "rollup_attributed",
        timezone: "UTC",
      },
      summary: {
        total: 20,
        unique: 14,
        repeated: 6,
        latest_verification_at: "2026-07-23T10:30:00.000Z",
      },
    });
    expect(body.series).toEqual([
      { date: "2026-07-17", total: 2, unique: 2, repeated: 0 },
      { date: "2026-07-18", total: 0, unique: 0, repeated: 0 },
      { date: "2026-07-19", total: 5, unique: 3, repeated: 2 },
      { date: "2026-07-20", total: 0, unique: 0, repeated: 0 },
      { date: "2026-07-21", total: 0, unique: 0, repeated: 0 },
      { date: "2026-07-22", total: 0, unique: 0, repeated: 0 },
      { date: "2026-07-23", total: 1, unique: 1, repeated: 0 },
    ]);
    expect(body.actions).toEqual({
      items: [
        {
          action_id: v4ActionIdA,
          action: "verify-alpha",
          description: "Alpha action",
          created_at: "2026-07-20T10:00:00.000Z",
          verifications: 11,
          unique_verifications: 9,
          repeated_verifications: 2,
          latest_verification_at: "2026-07-23T10:00:00.000Z",
        },
        {
          action_id: v4ActionIdB,
          action: "verify-beta",
          description: "Beta action",
          created_at: "2026-07-19T10:00:00.000Z",
          verifications: 7,
          unique_verifications: 4,
          repeated_verifications: 3,
          latest_verification_at: "2026-07-22T10:00:00.000Z",
        },
      ],
      page: 1,
      page_size: 12,
      total_items: 2,
      total_pages: 1,
    });
    expect(GetWorldIdAnalyticsAppTotal).toHaveBeenCalledWith({
      app_id: appId,
      source: "v4",
    });
    expect(GetWorldIdAnalyticsAppDailies).toHaveBeenCalledWith({
      app_id: appId,
      source: "v4",
      from: "2026-07-17",
    });
    expect(GetWorldIdAnalyticsPageActionStats).toHaveBeenCalledWith({
      action_ids: [v4ActionIdA, v4ActionIdB],
      source: "v4",
    });
  });
});

describe("GET /api/portal/apps/[app_id]/world-id-analytics [legacy]", () => {
  it("reports exact lifetime coverage and the legacy daily repeat start", async () => {
    const legacyDeltaStartedAt = "2026-06-01T00:00:00.000Z";
    GetWorldIdAnalyticsMeta.mockResolvedValueOnce({
      verification_analytics_meta: [
        ...freshMetaRows,
        {
          key: "legacy_daily_delta_started_at",
          timestamp_value: legacyDeltaStartedAt,
        },
      ],
    });
    GetWorldIdAnalyticsPageActionStats.mockResolvedValueOnce({
      action_verification_stats_total: [
        {
          action_id: legacyActionId,
          verifications: 3,
          unique_verifications: 2,
          repeated_verifications: 1,
          latest_verification_at: "2026-07-22T08:00:00.000Z",
        },
      ],
    });

    const { response, body } = await callHandler({ source: "legacy" });

    expect(response.status).toBe(200);
    expect(body.coverage).toMatchObject({
      lifetime_total: "exact",
      reuse_included_since: null,
      daily_repeats_included_since: legacyDeltaStartedAt,
    });
    expect(GetWorldIdAnalyticsLegacyActionsPage).toHaveBeenCalled();
    expect(GetWorldIdAnalyticsPageActionStats).toHaveBeenCalledWith({
      action_ids: [legacyActionId],
      source: "legacy",
    });
    expect(GetWorldIdAnalyticsV4ActionsPage).not.toHaveBeenCalled();
  });
});

describe("GET /api/portal/apps/[app_id]/world-id-analytics [all time]", () => {
  it("collapses more than seven dates into exactly seven buckets without losing measures", async () => {
    const dates = [
      "2026-05-15",
      "2026-05-24",
      "2026-05-25",
      "2026-06-04",
      "2026-06-14",
      "2026-06-24",
      "2026-07-04",
      "2026-07-14",
      "2026-07-23",
    ];
    const dailyRows = dates.map((date, index) => ({
      date,
      verifications: (index + 1) * 3,
      unique_verifications: (index + 1) * 2,
      repeated_verifications: index + 1,
    }));
    GetWorldIdAnalyticsAppDailies.mockResolvedValueOnce({
      app_verification_stats_daily: dailyRows,
    });

    const { response, body } = await callHandler({ period: "all_time" });

    expect(response.status).toBe(200);
    expect(body.series).toHaveLength(7);
    expect(body.series[6]).toEqual({
      date: "2026-07-14",
      total: 51,
      unique: 34,
      repeated: 17,
    });
    expect(
      body.series.reduce(
        (
          sums: { total: number; unique: number; repeated: number },
          point: { total: number; unique: number; repeated: number },
        ) => ({
          total: sums.total + point.total,
          unique: sums.unique + point.unique,
          repeated: sums.repeated + point.repeated,
        }),
        { total: 0, unique: 0, repeated: 0 },
      ),
    ).toEqual(
      dailyRows.reduce(
        (sums, row) => ({
          total: sums.total + row.verifications,
          unique: sums.unique + row.unique_verifications,
          repeated: sums.repeated + row.repeated_verifications,
        }),
        { total: 0, unique: 0, repeated: 0 },
      ),
    );
    expect(GetWorldIdAnalyticsAppDailies).toHaveBeenCalledWith({
      app_id: appId,
      source: "v4",
      from: "0001-01-01",
    });
  });
});

describe("GET /api/portal/apps/[app_id]/world-id-analytics [metadata and totals]", () => {
  it("marks data stale at sixteen minutes while preserving the response data", async () => {
    GetWorldIdAnalyticsMeta.mockResolvedValueOnce({
      verification_analytics_meta: [
        { key: "watermark_last_until", timestamp_value: asOf },
        {
          key: "watermark_last_success_at",
          timestamp_value: "2026-07-23T11:44:00.000Z",
        },
      ],
    });

    const { response, body } = await callHandler();

    expect(response.status).toBe(200);
    expect(body.stale).toBe(true);
    expect(body.summary.total).toBe(20);
    expect(body.series).toEqual(
      expect.arrayContaining([
        { date: "2026-07-23", total: 1, unique: 1, repeated: 0 },
      ]),
    );
  });

  it("returns a zeroed summary when the totals row is missing", async () => {
    GetWorldIdAnalyticsAppTotal.mockResolvedValueOnce({
      app_verification_stats_total_by_pk: null,
    });

    const { response, body } = await callHandler();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({
      total: 0,
      unique: 0,
      repeated: 0,
      latest_verification_at: null,
    });
  });
});
// #endregion

// #region Action validation and filtering
describe("GET /api/portal/apps/[app_id]/world-id-analytics [action validation]", () => {
  it("returns action_not_found when the v4 action belongs to another app", async () => {
    GetWorldIdAnalyticsV4Action.mockResolvedValueOnce({
      action_v4_by_pk: {
        environment: "production",
        rp_registration: { app_id: otherAppId },
      },
    });

    const { response, body } = await callHandler({
      action_id: v4ActionIdA,
    });

    expect(response.status).toBe(404);
    expect(body.code).toBe("action_not_found");
    expect(GetWorldIdAnalyticsV4Action).toHaveBeenCalledWith({
      action_id: v4ActionIdA,
    });
    expect(GetWorldIdAnalyticsActionTotal).not.toHaveBeenCalled();
  });

  it("returns action_not_found for a staging v4 action", async () => {
    GetWorldIdAnalyticsV4Action.mockResolvedValueOnce({
      action_v4_by_pk: {
        environment: "staging",
        rp_registration: { app_id: appId },
      },
    });

    const { response, body } = await callHandler({
      action_id: v4ActionIdA,
    });

    expect(response.status).toBe(404);
    expect(body.code).toBe("action_not_found");
    expect(GetWorldIdAnalyticsActionTotal).not.toHaveBeenCalled();
  });
});

describe("GET /api/portal/apps/[app_id]/world-id-analytics [search]", () => {
  it("passes one escaped ILIKE where clause to the v4 page and aggregate query", async () => {
    const escapedPattern = "%50\\%\\_off%";
    const expectedWhere = {
      rp_id: { _eq: rpId },
      environment: { _eq: "production" },
      _or: [
        { action: { _ilike: escapedPattern } },
        { description: { _ilike: escapedPattern } },
      ],
    };

    const { response } = await callHandler({ search: "50%_off" });

    expect(response.status).toBe(200);
    expect(GetWorldIdAnalyticsV4ActionsPage).toHaveBeenCalledTimes(1);
    expect(GetWorldIdAnalyticsV4ActionsPage).toHaveBeenCalledWith({
      where: expectedWhere,
      limit: 12,
      offset: 0,
    });
  });
});
// #endregion
