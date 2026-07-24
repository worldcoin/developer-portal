import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { GET } from "@/api/portal/apps/[app_id]/world-id-analytics/recent-activity";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import type { GraphQLClient } from "graphql-request";
import { NextRequest } from "next/server";

// #region Mocks
const GetWorldIdAnalyticsMeta = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-meta.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsMeta }),
  }),
);

const GetWorldIdAnalyticsRecentActivity = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-recent-activity.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsRecentActivity }),
  }),
);

const GetWorldIdAnalyticsV4Action = jest.fn();
jest.mock(
  "../../../api/portal/apps/[app_id]/world-id-analytics/graphql/get-v4-action.generated",
  () => ({
    getSdk: () => ({ GetWorldIdAnalyticsV4Action }),
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
const actionId = "action_v4_alpha";
const now = "2026-07-23T12:00:00.000Z";
const asOf = "2026-07-23T11:55:00.000Z";
const graphqlClient = {} as GraphQLClient;

const activityItems = [
  {
    nullifier: "0xolder",
    created_at: "2026-07-20T09:00:00.000Z",
    updated_at: "2026-07-20T10:00:00.000Z",
    uses: 3,
  },
  {
    nullifier: "0xnewer",
    created_at: "2026-07-22T09:00:00.000Z",
    updated_at: "2026-07-22T10:00:00.000Z",
    uses: 1,
  },
];

const sdkMocks = [
  GetWorldIdAnalyticsMeta,
  GetWorldIdAnalyticsRecentActivity,
  GetWorldIdAnalyticsV4Action,
];

function createRequest(params: Record<string, string> = {}) {
  const url = new URL(
    `http://localhost:3000/api/portal/apps/${appId}/world-id-analytics/recent-activity`,
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

async function callHandler(params: Record<string, string> = {}) {
  const response = await GET(createRequest(params), {
    params: Promise.resolve({ app_id: appId }),
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
  GetWorldIdAnalyticsV4Action.mockResolvedValue({
    action_v4_by_pk: {
      environment: "production",
      rp_registration: { app_id: appId },
    },
  });
  GetWorldIdAnalyticsRecentActivity.mockResolvedValue({
    nullifier_v4: activityItems,
  });
  GetWorldIdAnalyticsMeta.mockResolvedValue({
    verification_analytics_meta: [
      { key: "watermark_last_until", timestamp_value: asOf },
      { key: "watermark_last_success_at", timestamp_value: now },
    ],
  });
});

// #region Authorization and input validation
describe("GET recent World ID activity [authorization]", () => {
  it("returns 404 without making SDK calls when app read permission is denied", async () => {
    mockGetIsUserAllowedToReadApp.mockResolvedValueOnce(false);

    const { response, body } = await callHandler({ action_id: actionId });

    expect(response.status).toBe(404);
    expect(body.code).toBe("not_found");
    expect(mockGetAPIServiceGraphqlClient).not.toHaveBeenCalled();
    for (const sdkMock of sdkMocks) {
      expect(sdkMock).not.toHaveBeenCalled();
    }
  });
});

describe("GET recent World ID activity [validation]", () => {
  it("requires action_id", async () => {
    const { response, body } = await callHandler();

    expect(response.status).toBe(400);
    expect(body.code).toBe("required");
  });

  it("rejects the legacy source", async () => {
    const { response, body } = await callHandler({
      action_id: actionId,
      source: "legacy",
    });

    expect(response.status).toBe(400);
    expect(body.code).toBe("invalid_source");
  });

  it.each(["51", "0"])("rejects limit=%s", async (limit) => {
    const { response, body } = await callHandler({
      action_id: actionId,
      limit,
    });

    expect(response.status).toBe(400);
    expect(body.code).toBe("invalid_limit");
  });
});
// #endregion

// #region Action validation
describe("GET recent World ID activity [action validation]", () => {
  it("returns 404 when the action belongs to another app", async () => {
    GetWorldIdAnalyticsV4Action.mockResolvedValueOnce({
      action_v4_by_pk: {
        environment: "production",
        rp_registration: { app_id: otherAppId },
      },
    });

    const { response, body } = await callHandler({ action_id: actionId });

    expect(response.status).toBe(404);
    expect(body.code).toBe("action_not_found");
    expect(GetWorldIdAnalyticsRecentActivity).not.toHaveBeenCalled();
  });

  it("returns 404 for a staging action", async () => {
    GetWorldIdAnalyticsV4Action.mockResolvedValueOnce({
      action_v4_by_pk: {
        environment: "staging",
        rp_registration: { app_id: appId },
      },
    });

    const { response, body } = await callHandler({ action_id: actionId });

    expect(response.status).toBe(404);
    expect(body.code).toBe("action_not_found");
    expect(GetWorldIdAnalyticsRecentActivity).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Successful activity responses
describe("GET recent World ID activity [success]", () => {
  it.each([
    [{}, 20],
    [{ limit: "50" }, 50],
  ])("passes the requested limit to the SDK: %p", async (params, limit) => {
    const { response, body } = await callHandler({
      action_id: actionId,
      ...params,
    });

    expect(response.status).toBe(200);
    expect(GetWorldIdAnalyticsRecentActivity).toHaveBeenCalledWith({
      action_id: actionId,
      limit,
    });
    expect(body.items).toEqual(activityItems);
    expect(body.items.map((item: { uses: number }) => item.uses)).toEqual([
      3, 1,
    ]);
  });

  it("returns null as_of and stale true when metadata is absent", async () => {
    GetWorldIdAnalyticsMeta.mockResolvedValueOnce({
      verification_analytics_meta: [],
    });

    const { response, body } = await callHandler({ action_id: actionId });

    expect(response.status).toBe(200);
    expect(body.as_of).toBeNull();
    expect(body.stale).toBe(true);
    expect(body.items).toEqual(activityItems);
  });
});
// #endregion
