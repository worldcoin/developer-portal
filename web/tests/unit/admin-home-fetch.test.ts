const mockFetchAdminHome = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/scenes/Admin/graphql/server/fetch-admin-home.generated", () => ({
  getSdk: () => ({ FetchAdminHome: mockFetchAdminHome }),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

import { logger } from "@/lib/logger";
import {
  fetchAdminHome,
  getWorkflowStatus,
} from "@/scenes/Admin/server/fetch-home";

const aggregate = (count: number) => ({ aggregate: { count } });

const createHomeResponse = () => ({
  active_api_keys: aggregate(3),
  active_apps: aggregate(7),
  active_teams: aggregate(5),
  apps_awaiting_review: [
    {
      draft_metadata: [
        {
          name: "Waiting app",
          updated_at: "2026-07-09T00:00:00.000Z",
          verification_status: "awaiting_review",
        },
      ],
      id: "app_waiting_review",
      name: "Waiting source app",
      team_id: "team_current",
      verified_metadata: [],
    },
  ],
  apps_awaiting_review_count: aggregate(7),
  apps_changes_requested: [
    {
      draft_metadata: [
        {
          name: "Reviewed app",
          updated_at: "2026-07-10T00:00:00.000Z",
          verification_status: "changes_requested",
        },
      ],
      id: "app_changes_requested",
      name: "Source app name",
      team_id: "team_current",
      verified_metadata: [
        {
          name: "Previously verified app",
          verification_status: "verified",
          verified_at: "2026-07-01T00:00:00.000Z",
        },
      ],
    },
  ],
  apps_changes_requested_count: aggregate(8),
  apps_without_metadata: [
    {
      created_at: "2026-07-01T00:00:00.000Z",
      id: "app_without_metadata",
      name: "Missing metadata",
      team_id: "team_current",
    },
  ],
  apps_without_metadata_count: aggregate(9),
  deleted_apps: aggregate(2),
  deleted_teams: aggregate(1),
  new_apps: aggregate(4),
  new_teams: aggregate(2),
  new_users: aggregate(6),
  sole_owner_memberships: [
    {
      team: {
        id: "team_sole_owner",
        memberships_aggregate: aggregate(1),
        name: "Sole owner team",
      },
      user: {
        email: "owner@example.com",
        id: "user_owner",
        name: "Owner",
      },
    },
  ],
  sole_owner_memberships_count: aggregate(10),
  pending_invites: aggregate(2),
  recent_apps: [
    {
      created_at: "2026-07-10T00:00:00.000Z",
      draft_metadata: [{ verification_status: "awaiting_review" }],
      id: "app_recent",
      name: "Recent app",
      team_id: "team_current",
      verified_metadata: [],
    },
  ],
  recent_metadata: [
    {
      app_id: "app_recent",
      name: "Recent app",
      updated_at: "2026-07-11T00:00:00.000Z",
      verification_status: "awaiting_review",
    },
  ],
  recent_teams: [
    {
      created_at: "2026-07-10T00:00:00.000Z",
      deleted_at: null,
      id: "team_recent",
      name: "Recent team",
    },
  ],
  recent_users: [
    {
      created_at: "2026-07-10T00:00:00.000Z",
      email: "recent@example.com",
      id: "user_recent",
      name: "Recent user",
    },
  ],
  teams_without_owner: [
    {
      created_at: "2026-07-09T00:00:00.000Z",
      id: "team_without_owner",
      name: "No owner team",
    },
  ],
  teams_without_owner_count: aggregate(11),
  total_users: aggregate(11),
  users_without_teams: [
    {
      created_at: "2026-07-09T00:00:00.000Z",
      email: "unassigned@example.com",
      id: "user_without_team",
      name: "Unassigned user",
    },
  ],
  users_without_teams_count: aggregate(12),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("admin home fetch", () => {
  it("uses the current draft metadata status and maps dashboard queues", async () => {
    mockFetchAdminHome.mockResolvedValue(createHomeResponse());

    const home = await fetchAdminHome();

    expect(home.inventory).toEqual({
      activeApiKeys: 3,
      activeApps: 7,
      activeTeams: 5,
      deletedApps: 2,
      deletedTeams: 1,
      newApps: 4,
      newTeams: 2,
      newUsers: 6,
      pendingInvites: 2,
      totalUsers: 11,
    });
    expect(home.queues.appsAwaitingReview).toEqual([
      expect.objectContaining({ id: "app_waiting_review" }),
    ]);
    expect(home.queues.appsChangesRequested).toEqual([
      expect.objectContaining({ id: "app_changes_requested" }),
    ]);
    expect(home.queues.soleOwnerTeams).toEqual([
      expect.objectContaining({ id: "team_sole_owner" }),
    ]);
    expect(home.queues.usersWithoutTeams).toEqual([
      expect.objectContaining({ id: "user_without_team" }),
    ]);
    expect(home.queueCounts).toEqual({
      appsAwaitingReview: 7,
      appsChangesRequested: 8,
      appsWithoutMetadata: 9,
      soleOwnerTeams: 10,
      teamsWithoutOwner: 11,
      usersWithoutTeams: 12,
    });
  });

  it("prioritizes the latest non-verified metadata over verified metadata", () => {
    expect(
      getWorkflowStatus({
        draft_metadata: [{ verification_status: "changes_requested" }],
        verified_metadata: [{ verification_status: "verified" }],
      }),
    ).toBe("changes_requested");
  });

  it("logs and rethrows GraphQL errors", async () => {
    const error = new Error("GraphQL request failed");
    mockFetchAdminHome.mockRejectedValue(error);

    await expect(fetchAdminHome()).rejects.toThrow(error);
    expect(logger.error).toHaveBeenCalledWith("Failed to fetch admin home", {
      error,
    });
  });
});
