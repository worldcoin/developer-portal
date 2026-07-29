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

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const FetchMemberships = jest.fn();
jest.mock(
  "../../scenes/Root/page/graphql/server/fetch-memberships.generated",
  () => ({
    getSdk: () => ({ FetchMemberships }),
  }),
);

jest.mock("@/scenes/Onboarding/Home/layout", () => ({
  HomeLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
jest.mock("@/scenes/Onboarding/Home/page", () => ({
  HomePage: () => <div data-testid="home-page" />,
}));

const InitialApp = jest.fn();
jest.mock(
  "../../scenes/Portal/Teams/TeamId/Apps/page/graphql/server/apps.generated",
  () => ({
    getSdk: () => ({ InitialApp }),
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
import { RootPage } from "@/scenes/Root/page";

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

// #region Root routing
describe("/ [zero memberships]", () => {
  it("re-enters the login callback so a first team is provisioned", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([]));
    FetchMemberships.mockResolvedValue({ membership: [] });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login-callback"),
    );
  });
});
// #endregion

// #region Membership guards
describe.each([
  ["v3", AppsPageV3],
  ["v2", AppsPageV2],
])("/teams/[teamId]/apps [%s, membership guard]", (_version, AppsPage) => {
  it("re-enters the login callback for a user with zero memberships", async () => {
    getSession.mockResolvedValue(sessionWithMemberships([]));

    await AppsPage(props("team_1"));

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login-callback"),
    );
    expect(InitialApp).not.toHaveBeenCalled();
  });

  it("redirects a member of another team to their own team's apps", async () => {
    getSession.mockResolvedValue(sessionWithMemberships(["team_mine"]));

    await AppsPage(props("team_foreign"));

    expect(redirect).toHaveBeenCalledWith("/teams/team_mine/apps");
    expect(InitialApp).not.toHaveBeenCalled();
  });

  it("does not redirect a member of the requested team", async () => {
    getSession.mockResolvedValue(sessionWithMemberships(["team_1"]));

    const result = await AppsPage(props("team_1"));

    expect(redirect).not.toHaveBeenCalled();
    expect(InitialApp).toHaveBeenCalledWith({ teamId: "team_1" });
    expect(result).toBeTruthy();
  });
});
// #endregion
