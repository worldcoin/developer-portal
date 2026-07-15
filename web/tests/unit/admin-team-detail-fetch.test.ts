const mockFetchAdminTeamApps = jest.fn();
const mockFetchAdminTeamDetails = jest.fn();
const mockFetchAdminTeamMembers = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/teams/graphql/server/fetch-admin-team-apps.generated",
  () => ({
    getSdk: () => ({ FetchAdminTeamApps: mockFetchAdminTeamApps }),
  }),
);

jest.mock(
  "@/scenes/Admin/teams/graphql/server/fetch-admin-team-details.generated",
  () => ({
    getSdk: () => ({ FetchAdminTeamDetails: mockFetchAdminTeamDetails }),
  }),
);

jest.mock(
  "@/scenes/Admin/teams/graphql/server/fetch-admin-team-members.generated",
  () => ({
    getSdk: () => ({ FetchAdminTeamMembers: mockFetchAdminTeamMembers }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import {
  createAdminTeamAppsWhere,
  fetchAdminTeamAppsPage,
} from "@/scenes/Admin/teams/id/server/fetch-team-apps";
import { fetchAdminTeamDetails } from "@/scenes/Admin/teams/id/server/fetch-team-details";
import {
  createAdminTeamMembersWhere,
  fetchAdminTeamMembersPage,
} from "@/scenes/Admin/teams/id/server/fetch-team-members";

describe("admin team detail fetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps app searches scoped to the route team", () => {
    expect(createAdminTeamAppsWhere("team_current", "team:team_other")).toEqual(
      {
        _and: [
          { team_id: { _eq: "team_current" } },
          { team_id: { _ilike: "%team_other%" } },
        ],
      },
    );
  });

  it("keeps member searches scoped to the route team", () => {
    expect(
      createAdminTeamMembersWhere("team_current", "email:world.org"),
    ).toEqual({
      _and: [
        { team_id: { _eq: "team_current" } },
        { user: { email: { _ilike: "%world.org%" } } },
      ],
    });
  });

  it("does not apply plain search text to the role enum", () => {
    expect(createAdminTeamMembersWhere("team_current", "test")).toEqual({
      _and: [
        { team_id: { _eq: "team_current" } },
        {
          _or: [
            { user_id: { _ilike: "%test%" } },
            { user: { name: { _ilike: "%test%" } } },
            { user: { email: { _ilike: "%test%" } } },
          ],
        },
      ],
    });
  });

  it("strips quotes and normalizes detail-search field names", () => {
    expect(
      createAdminTeamMembersWhere("team_current", 'NAME:"Jane Doe"'),
    ).toEqual({
      _and: [
        { team_id: { _eq: "team_current" } },
        { user: { name: { _ilike: "%Jane Doe%" } } },
      ],
    });
  });

  it("maps overview aggregates and inventories", async () => {
    mockFetchAdminTeamDetails.mockResolvedValue({
      api_key: [{ id: "key_1", is_active: true }],
      api_key_aggregate: { aggregate: { count: 1 } },
      app_aggregate: { aggregate: { count: 2 } },
      invite: [
        { email: "admin@example.com", expires_at: "2026-08-01", id: "inv_1" },
      ],
      invite_aggregate: { aggregate: { count: 1 } },
      membership_aggregate: { aggregate: { count: 3 } },
      team_by_pk: {
        created_at: "2026-01-01",
        deleted_at: null,
        id: "team_current",
        name: "Current team",
      },
    });

    await expect(fetchAdminTeamDetails("team_current")).resolves.toEqual(
      expect.objectContaining({
        activeApiKeysCount: 1,
        appsCount: 2,
        membersCount: 3,
        pendingInvitesCount: 1,
      }),
    );
  });

  it("returns null when the team does not exist", async () => {
    mockFetchAdminTeamDetails.mockResolvedValue({
      api_key: [],
      api_key_aggregate: { aggregate: { count: 0 } },
      app_aggregate: { aggregate: { count: 0 } },
      invite: [],
      invite_aggregate: { aggregate: { count: 0 } },
      membership_aggregate: { aggregate: { count: 0 } },
      team_by_pk: null,
    });

    await expect(fetchAdminTeamDetails("team_missing")).resolves.toBeNull();
  });

  it("loads all pages through the current infinite-scroll page", async () => {
    mockFetchAdminTeamApps.mockResolvedValue({
      app: [],
      app_aggregate: { aggregate: { count: 21 } },
    });
    mockFetchAdminTeamMembers.mockResolvedValue({
      membership: [],
      membership_aggregate: { aggregate: { count: 21 } },
    });

    await fetchAdminTeamAppsPage({
      page: 2,
      searchQuery: "",
      teamId: "team_current",
    });
    await fetchAdminTeamMembersPage({
      page: 2,
      searchQuery: "",
      teamId: "team_current",
    });

    expect(mockFetchAdminTeamApps).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 0,
        offset: 0,
        where: { _and: [{ team_id: { _eq: "team_current" } }, {}] },
      }),
    );
    expect(mockFetchAdminTeamApps).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 20,
        offset: 0,
        where: { _and: [{ team_id: { _eq: "team_current" } }, {}] },
      }),
    );
    expect(mockFetchAdminTeamMembers).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 0,
        offset: 0,
        where: { team_id: { _eq: "team_current" } },
      }),
    );
    expect(mockFetchAdminTeamMembers).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 20,
        offset: 0,
        where: { team_id: { _eq: "team_current" } },
      }),
    );
  });

  it("clamps an out-of-range detail page before fetching cumulative items", async () => {
    mockFetchAdminTeamApps.mockResolvedValue({
      app: [{ id: "app_current" }],
      app_aggregate: { aggregate: { count: 21 } },
    });

    const result = await fetchAdminTeamAppsPage({
      page: 99,
      searchQuery: "",
      teamId: "team_current",
    });

    expect(result.currentPage).toBe(3);
    expect(mockFetchAdminTeamApps).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 30, offset: 0 }),
    );
  });
});
