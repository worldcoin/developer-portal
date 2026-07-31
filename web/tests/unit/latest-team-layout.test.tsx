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

const after = jest.fn((callback: () => unknown) => callback());
jest.mock("next/server", () => ({
  after: (callback: () => unknown) => after(callback),
}));

jest.mock("@/scenes/common/Apps/AppCreatedToast", () => ({
  AppCreatedToast: () => null,
}));
jest.mock("@/scenes/common/Teams/TeamCreatedToast", () => ({
  TeamCreatedToast: () => null,
}));
// #endregion

import { TeamIdLayout } from "@/scenes/PortalV3/Teams/TeamId/layout";

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
});

// #region Latest team recording
describe("PortalV3 team layout [latest team recording]", () => {
  it("records a successful member visit after the response", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1"]));

    await TeamIdLayout({
      params: Promise.resolve({ teamId: "team_1" }),
      children: <div />,
    });

    expect(after).toHaveBeenCalledTimes(1);
    expect(rememberLatestTeam).toHaveBeenCalledWith("user_1", "team_1");
  });

  it("does not record a team outside the user's current memberships", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1"]));

    await TeamIdLayout({
      params: Promise.resolve({ teamId: "team_foreign" }),
      children: <div />,
    });

    expect(after).not.toHaveBeenCalled();
    expect(rememberLatestTeam).not.toHaveBeenCalled();
  });

  it("does not record a team without an authenticated user", async () => {
    getSession.mockResolvedValue(null);

    await TeamIdLayout({
      params: Promise.resolve({ teamId: "team_1" }),
      children: <div />,
    });

    expect(after).not.toHaveBeenCalled();
    expect(rememberLatestTeam).not.toHaveBeenCalled();
  });
});
// #endregion
