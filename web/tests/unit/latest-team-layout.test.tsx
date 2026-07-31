import React from "react";

// #region Mocks
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

const rememberLatestTeam = jest.fn();
jest.mock("@/scenes/PortalV3/Dashboard/server/latest-team", () => ({
  rememberLatestTeam: (...args: unknown[]) => rememberLatestTeam(...args),
}));

const getHeader = jest.fn();
jest.mock("next/headers", () => ({
  headers: async () => ({ get: (...args: unknown[]) => getHeader(...args) }),
}));

const after = jest.fn((callback: () => unknown) => callback());
jest.mock("next/server", () => ({
  after: (callback: () => unknown) => after(callback),
}));

jest.mock(
  "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request",
  () => ({
    fetchSandboxAccessRequest: jest.fn().mockResolvedValue(null),
  }),
);
jest.mock("@/lib/is-world-user", () => ({
  isWorldUser: () => false,
}));
jest.mock("@/scenes/PortalV3/layout/Shell", () => ({
  PortalShell: ({ children }: { children: React.ReactNode }) => children,
}));
// #endregion

import { PortalLayout } from "@/scenes/PortalV3/layout";

const sessionWithTeams = (teamIds: string[]) => ({
  user: {
    hasura: {
      id: "user_1",
      memberships: teamIds.map((id) => ({ team: { id } })),
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  getHeader.mockReturnValue("/teams/team_1");
});

// #region Latest team recording
describe("PortalV3 layout [latest team recording]", () => {
  it("records a successful member visit after the response", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1"]));

    await PortalLayout({ children: <div /> });

    expect(after).toHaveBeenCalledTimes(1);
    expect(rememberLatestTeam).toHaveBeenCalledWith("user_1", "team_1");
  });

  it("does not record a team outside the user's current memberships", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1"]));
    getHeader.mockReturnValue("/teams/team_foreign");

    await PortalLayout({ children: <div /> });

    expect(after).not.toHaveBeenCalled();
    expect(rememberLatestTeam).not.toHaveBeenCalled();
  });

  it("does not record non-team Portal V3 routes", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1"]));
    getHeader.mockReturnValue("/profile");

    await PortalLayout({ children: <div /> });

    expect(after).not.toHaveBeenCalled();
    expect(rememberLatestTeam).not.toHaveBeenCalled();
  });
});
// #endregion
