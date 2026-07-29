// #region Mocks
jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest
      .fn()
      .mockResolvedValue({ user: { hasura: { id: "usr_1" } } }),
    updateSession: jest.fn(),
  },
}));
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToDeleteTeam: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

const mockFetchUserForSession = jest.fn();
jest.mock(
  "@/api/update-session/graphql/server/fetch-user-for-session.generated",
  () => ({ getSdk: () => ({ FetchUserForSession: mockFetchUserForSession }) }),
);

const mockDeleteTeam = jest.fn();
jest.mock(
  "@/scenes/common/common/DeleteTeamDialog/graphql/server/delete-team.generated",
  () => ({ getSdk: () => ({ DeleteTeam: mockDeleteTeam }) }),
);
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));
// #endregion

import { deleteTeamServerSide } from "@/scenes/common/common/DeleteTeamDialog/server";

beforeEach(() => jest.clearAllMocks());

// #region Final-team guard
describe("deleteTeamServerSide [final-team guard]", () => {
  it("rejects deletion when it would remove the user's only team", async () => {
    mockFetchUserForSession.mockResolvedValue({
      user_by_pk: { memberships: [{ team: { id: "team_1" } }] },
    });

    expect((await deleteTeamServerSide("team_1")).success).toBe(false);
    expect(mockDeleteTeam).not.toHaveBeenCalled();
  });

  it("deletes when another team remains", async () => {
    mockFetchUserForSession
      .mockResolvedValueOnce({ user_by_pk: { memberships: [{}, {}] } })
      .mockResolvedValueOnce({ user_by_pk: { memberships: [{}] } });

    expect(await deleteTeamServerSide("team_1")).toMatchObject({
      success: true,
      sessionUpdated: true,
    });
    expect(mockDeleteTeam).toHaveBeenCalledWith({ id: "team_1" });
  });
});
// #endregion
