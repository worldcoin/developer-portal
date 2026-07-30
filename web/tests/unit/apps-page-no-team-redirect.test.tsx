import React from "react";

// #region Mocks
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

let mockCookieValue: string | undefined;
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      mockCookieValue === undefined ? undefined : { value: mockCookieValue },
  }),
}));

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const ResolveInitialApp = jest.fn();
jest.mock(
  "../../scenes/common/Teams/TeamId/Apps/server/graphql/resolve-initial-app.generated",
  () => ({
    getSdk: () => ({ ResolveInitialApp }),
  }),
);

jest.mock(
  "../../scenes/PortalV3/Teams/TeamId/Apps/page/AppsPageClient",
  () => ({
    AppsPageClient: () => <div data-testid="v3-apps-client" />,
  }),
);
jest.mock("../../scenes/Portal/Teams/TeamId/Apps/page/AppsPageClient", () => ({
  AppsPageClient: () => <div data-testid="v2-apps-client" />,
}));
// #endregion

import { AppsPage as AppsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/page";
import { AppsPage as AppsPageV2 } from "@/scenes/Portal/Teams/TeamId/Apps/page";
import { serializePortalContext } from "@/lib/portal-context";

// #region Test Data
const USER_ID = "usr_11111111111111111111111111111111";
const TEAM_ID = "team_11111111111111111111111111111111";
const PREFERRED_APP_ID = "app_11111111111111111111111111111111";
const FALLBACK_APP_ID = "app_22222222222222222222222222222222";

const props = (teamId: string) => ({
  params: Promise.resolve({ teamId }),
});

const sessionWithMemberships = (teamIds: string[]) => ({
  user: {
    hasura: {
      id: USER_ID,
      memberships: teamIds.map((id) => ({ team: { id } })),
    },
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieValue = undefined;
  ResolveInitialApp.mockResolvedValue({
    preferredApp: [],
    fallbackApp: [],
  });
});

// #region Users with no team stay in the portal, not logged out
describe.each([
  ["v3", AppsPageV3],
  ["v2", AppsPageV2],
])("/teams/[teamId]/apps [%s, membership guard]", (_version, AppsPage) => {
  it("redirects a user with zero memberships to their profile", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([]));

    await AppsPage(props("team_1"));

    expect(redirect).toHaveBeenCalledWith("/profile");
    expect(ResolveInitialApp).not.toHaveBeenCalled();
  });

  it("redirects a member of another team to their own team's apps", async () => {
    getSession.mockResolvedValue(sessionWithMemberships(["team_mine"]));

    await AppsPage(props("team_foreign"));

    expect(redirect).toHaveBeenCalledWith("/teams/team_mine/apps");
    expect(ResolveInitialApp).not.toHaveBeenCalled();
  });

  it("renders app creation when the requested team has no active apps", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([TEAM_ID]));

    const result = await AppsPage(props(TEAM_ID));

    expect(redirect).not.toHaveBeenCalled();
    expect(ResolveInitialApp).toHaveBeenCalledWith({
      teamId: TEAM_ID,
      userId: USER_ID,
      preferredAppId: "",
    });
    expect(result).toBeTruthy();
  });

  it("redirects to the remembered active app", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([TEAM_ID]));
    mockCookieValue = serializePortalContext({
      userId: USER_ID,
      teamId: TEAM_ID,
      appId: PREFERRED_APP_ID,
    });
    ResolveInitialApp.mockResolvedValue({
      preferredApp: [{ id: PREFERRED_APP_ID }],
      fallbackApp: [{ id: FALLBACK_APP_ID }],
    });

    await AppsPage(props(TEAM_ID));

    expect(ResolveInitialApp).toHaveBeenCalledWith({
      teamId: TEAM_ID,
      userId: USER_ID,
      preferredAppId: PREFERRED_APP_ID,
    });
    expect(redirect).toHaveBeenCalledWith(
      _version === "v3"
        ? `/teams/${TEAM_ID}/apps/${PREFERRED_APP_ID}/world-id-4-0`
        : `/teams/${TEAM_ID}/apps/${PREFERRED_APP_ID}`,
    );
  });

  it("redirects to the deterministic fallback when the preference is stale", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([TEAM_ID]));
    mockCookieValue = serializePortalContext({
      userId: USER_ID,
      teamId: TEAM_ID,
      appId: PREFERRED_APP_ID,
    });
    ResolveInitialApp.mockResolvedValue({
      preferredApp: [],
      fallbackApp: [{ id: FALLBACK_APP_ID }],
    });

    await AppsPage(props(TEAM_ID));

    expect(redirect).toHaveBeenCalledWith(
      _version === "v3"
        ? `/teams/${TEAM_ID}/apps/${FALLBACK_APP_ID}/world-id-4-0`
        : `/teams/${TEAM_ID}/apps/${FALLBACK_APP_ID}`,
    );
  });
});
// #endregion
