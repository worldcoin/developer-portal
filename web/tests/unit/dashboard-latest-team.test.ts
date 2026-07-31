import { DashboardPage } from "@/scenes/PortalV3/Dashboard/page";

// #region Mocks
const getSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => getSession(...args) },
}));

const getLatestTeamId = jest.fn();
jest.mock("@/scenes/PortalV3/Dashboard/server/latest-team", () => ({
  getLatestTeamId: (...args: unknown[]) => getLatestTeamId(...args),
}));

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    createTeam: () => "/create-team",
    logout: () => "/logout",
    teams: ({ team_id }: { team_id: string }) => `/teams/${team_id}`,
  },
}));
// #endregion

// #region Test Data
const sessionWithTeams = (teamIds: string[]) => ({
  user: {
    hasura: {
      id: "user_1",
      memberships: teamIds.map((id) => ({ team: { id } })),
    },
  },
});
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getLatestTeamId.mockResolvedValue(undefined);
});

// #region Latest team resolution
describe("/dashboard [latest team resolution]", () => {
  it("redirects to the remembered team when membership is still valid", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1", "team_2"]));
    getLatestTeamId.mockResolvedValue("team_2");

    await DashboardPage();

    expect(getLatestTeamId).toHaveBeenCalledWith("user_1");
    expect(redirect).toHaveBeenCalledWith("/teams/team_2");
  });

  it("falls back to the first current membership for a stale Redis value", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1", "team_2"]));
    getLatestTeamId.mockResolvedValue("team_deleted");

    await DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/teams/team_1");
  });

  it("falls back to the first membership when Redis has no value", async () => {
    getSession.mockResolvedValue(sessionWithTeams(["team_1", "team_2"]));

    await DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/teams/team_1");
  });
});
// #endregion

// #region Session guards
describe("/dashboard [session guards]", () => {
  it("routes users without teams into team creation", async () => {
    getSession.mockResolvedValue(sessionWithTeams([]));

    await DashboardPage();

    expect(getLatestTeamId).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/create-team");
  });

  it("re-authenticates sessions missing the Hasura claim", async () => {
    getSession.mockResolvedValue({ user: {} });

    await DashboardPage();

    expect(getLatestTeamId).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/logout");
  });

  it("re-authenticates incomplete Hasura claims without memberships", async () => {
    getSession.mockResolvedValue({ user: { hasura: { id: "user_1" } } });

    await DashboardPage();

    expect(getLatestTeamId).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/logout");
  });
});
// #endregion
