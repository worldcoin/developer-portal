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
  HomePage: () => <div />,
}));
// #endregion

import { serializePortalContext } from "@/lib/portal-context";
import { TeamsPage } from "@/scenes/Portal/Teams/page";
import { RootPage } from "@/scenes/Root/page";

// #region Test Data
const USER_ID = "usr_11111111111111111111111111111111";
const OTHER_USER_ID = "usr_22222222222222222222222222222222";
const TEAM_A_ID = "team_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEAM_B_ID = "team_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const sessionWithTeams = (teamIds: string[]) => ({
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
  getSession.mockResolvedValue(sessionWithTeams([TEAM_A_ID, TEAM_B_ID]));
  FetchMemberships.mockResolvedValue({
    membership: [{ team_id: TEAM_A_ID }, { team_id: TEAM_B_ID }],
  });
});

// #region Root entry
describe("RootPage remembered team", () => {
  it("redirects to the remembered current membership", async () => {
    mockCookieValue = serializePortalContext({
      userId: USER_ID,
      teamId: TEAM_B_ID,
    });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith(`/teams/${TEAM_B_ID}/apps`);
  });

  it("falls back to the first membership for another user's cookie", async () => {
    mockCookieValue = serializePortalContext({
      userId: OTHER_USER_ID,
      teamId: TEAM_B_ID,
    });

    await RootPage();

    expect(redirect).toHaveBeenCalledWith(`/teams/${TEAM_A_ID}/apps`);
  });
});
// #endregion

// #region Teams entry
describe("TeamsPage remembered team", () => {
  it("redirects to the remembered session membership", async () => {
    mockCookieValue = serializePortalContext({
      userId: USER_ID,
      teamId: TEAM_B_ID,
    });

    await TeamsPage();

    expect(redirect).toHaveBeenCalledWith(`/teams/${TEAM_B_ID}`);
  });
});
// #endregion
