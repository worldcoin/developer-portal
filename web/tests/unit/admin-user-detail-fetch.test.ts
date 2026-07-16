const mockFetchAdminUserApps = jest.fn();
const mockFetchAdminUserDetails = jest.fn();
const mockFetchAdminUserTeams = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/users/graphql/server/fetch-admin-user-apps.generated",
  () => ({
    getSdk: () => ({ FetchAdminUserApps: mockFetchAdminUserApps }),
  }),
);

jest.mock(
  "@/scenes/Admin/users/graphql/server/fetch-admin-user-details.generated",
  () => ({
    getSdk: () => ({ FetchAdminUserDetails: mockFetchAdminUserDetails }),
  }),
);

jest.mock(
  "@/scenes/Admin/users/graphql/server/fetch-admin-user-teams.generated",
  () => ({
    getSdk: () => ({ FetchAdminUserTeams: mockFetchAdminUserTeams }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import {
  createAdminUserAppsWhere,
  fetchAdminUserAppsPage,
} from "@/scenes/Admin/users/id/server/fetch-user-apps";
import { fetchAdminUserDetails } from "@/scenes/Admin/users/id/server/fetch-user-details";
import {
  createAdminUserTeamsWhere,
  fetchAdminUserTeamsPage,
} from "@/scenes/Admin/users/id/server/fetch-user-teams";

describe("admin user detail fetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps app searches scoped to teams of the route user", () => {
    expect(createAdminUserAppsWhere("user_current", "team:team_other")).toEqual(
      {
        _and: [
          { team: { memberships: { user_id: { _eq: "user_current" } } } },
          { team_id: { _ilike: "%team_other%" } },
        ],
      },
    );
  });

  it("keeps team searches scoped to the route user", () => {
    expect(createAdminUserTeamsWhere("user_current", "name:World")).toEqual({
      _and: [
        { user_id: { _eq: "user_current" } },
        { team: { name: { _ilike: "%World%" } } },
      ],
    });
  });

  it("returns no matches for an invalid role or status", () => {
    expect(createAdminUserTeamsWhere("user_current", "role:invalid")).toEqual({
      _and: [{ user_id: { _eq: "user_current" } }, { team_id: { _in: [] } }],
    });
    expect(createAdminUserTeamsWhere("user_current", "status:unknown")).toEqual(
      {
        _and: [{ user_id: { _eq: "user_current" } }, { team_id: { _in: [] } }],
      },
    );
  });

  it("strips quotes and normalizes detail-search field names", () => {
    expect(createAdminUserTeamsWhere("user_current", 'NAME:"My team"')).toEqual(
      {
        _and: [
          { user_id: { _eq: "user_current" } },
          { team: { name: { _ilike: "%My team%" } } },
        ],
      },
    );
  });

  it("maps aggregates and support warnings", async () => {
    mockFetchAdminUserDetails.mockResolvedValue({
      admins: { aggregate: { count: 1 } },
      apps: { aggregate: { count: 4 } },
      deleted_team_memberships: [
        {
          id: "membership_deleted",
          team: {
            deleted_at: "2026-01-01",
            id: "team_deleted",
            name: "Deleted",
          },
        },
      ],
      members: { aggregate: { count: 2 } },
      memberships: { aggregate: { count: 5 } },
      owner_memberships: [
        {
          id: "membership_sole",
          team: {
            deleted_at: null,
            id: "team_sole",
            memberships_aggregate: { aggregate: { count: 1 } },
            name: "Sole owner",
          },
        },
        {
          id: "membership_shared",
          team: {
            deleted_at: null,
            id: "team_shared",
            memberships_aggregate: { aggregate: { count: 2 } },
            name: "Shared owner",
          },
        },
      ],
      owners: { aggregate: { count: 2 } },
      user_by_pk: {
        created_at: "2026-01-01",
        email: "admin@example.com",
        id: "user_current",
        name: "Current user",
      },
    });

    await expect(fetchAdminUserDetails("user_current")).resolves.toEqual(
      expect.objectContaining({
        activeAppsCount: 4,
        adminCount: 1,
        deletedTeams: [
          { deleted_at: "2026-01-01", id: "team_deleted", name: "Deleted" },
        ],
        memberCount: 2,
        ownerCount: 2,
        soleOwnerTeams: [
          expect.objectContaining({ id: "team_sole", name: "Sole owner" }),
        ],
        teamsCount: 5,
      }),
    );
  });

  it("returns null when the user does not exist", async () => {
    mockFetchAdminUserDetails.mockResolvedValue({
      admins: { aggregate: { count: 0 } },
      apps: { aggregate: { count: 0 } },
      deleted_team_memberships: [],
      members: { aggregate: { count: 0 } },
      memberships: { aggregate: { count: 0 } },
      owner_memberships: [],
      owners: { aggregate: { count: 0 } },
      user_by_pk: null,
    });

    await expect(fetchAdminUserDetails("user_missing")).resolves.toBeNull();
  });

  it("loads all pages through the current infinite-scroll page", async () => {
    mockFetchAdminUserApps.mockResolvedValue({
      app: [],
      app_aggregate: { aggregate: { count: 21 } },
    });
    mockFetchAdminUserTeams.mockResolvedValue({
      membership: [],
      membership_aggregate: { aggregate: { count: 21 } },
    });

    await fetchAdminUserAppsPage({
      page: 2,
      searchQuery: "",
      userId: "user_current",
    });
    await fetchAdminUserTeamsPage({
      page: 2,
      searchQuery: "",
      userId: "user_current",
    });

    expect(mockFetchAdminUserApps).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 0,
        offset: 0,
        where: {
          _and: [
            { team: { memberships: { user_id: { _eq: "user_current" } } } },
            {},
          ],
        },
      }),
    );
    expect(mockFetchAdminUserApps).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 20,
        offset: 0,
        where: {
          _and: [
            { team: { memberships: { user_id: { _eq: "user_current" } } } },
            {},
          ],
        },
      }),
    );
    expect(mockFetchAdminUserTeams).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 0,
        offset: 0,
        where: { user_id: { _eq: "user_current" } },
      }),
    );
    expect(mockFetchAdminUserTeams).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 20,
        offset: 0,
        where: { user_id: { _eq: "user_current" } },
      }),
    );
  });
});
