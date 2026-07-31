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

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const InitialApp = jest.fn();
jest.mock(
  "../../scenes/Portal/Teams/TeamId/Apps/page/graphql/server/apps.generated",
  () => ({
    getSdk: () => ({ InitialApp }),
  }),
);

jest.mock("../../scenes/Portal/Teams/TeamId/Apps/page/AppsPageClient", () => ({
  AppsPageClient: () => <div data-testid="v2-apps-client" />,
}));
// #endregion

import { AppsPage as AppsPageV2 } from "@/scenes/Portal/Teams/TeamId/Apps/page";

// #region Test Data
const props = (teamId: string) => ({
  params: Promise.resolve({ teamId }),
});

const sessionWithMemberships = (teamIds: string[]) => ({
  user: {
    hasura: {
      id: "usr_1",
      memberships: teamIds.map((id) => ({ team: { id } })),
    },
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  InitialApp.mockResolvedValue({ app: [] });
});

// #region Users with no team stay in the portal, not logged out
describe("/teams/[teamId]/apps [v2 membership guard]", () => {
  it("redirects a user with zero memberships to their profile", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([]));

    await AppsPageV2(props("team_1"));

    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("redirects a member of another team to their own team's apps", async () => {
    getSession.mockResolvedValue(sessionWithMemberships(["team_mine"]));

    await AppsPageV2(props("team_foreign"));

    expect(redirect).toHaveBeenCalledWith("/teams/team_mine/apps");
  });

  it("does not redirect a member of the requested team", async () => {
    getSession.mockResolvedValue(sessionWithMemberships(["team_1"]));

    const result = await AppsPageV2(props("team_1"));

    expect(redirect).not.toHaveBeenCalled();
    expect(InitialApp).toHaveBeenCalledWith({ teamId: "team_1" });
    expect(result).toBeTruthy();
  });
});
// #endregion
