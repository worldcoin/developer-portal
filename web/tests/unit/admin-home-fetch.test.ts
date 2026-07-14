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
  apps_without_metadata: [
    {
      created_at: "2026-07-01T00:00:00.000Z",
      id: "app_without_metadata",
      name: "Missing metadata",
      team_id: "team_current",
    },
  ],
  deleted_apps: aggregate(2),
  deleted_teams: aggregate(1),
  new_apps: aggregate(4),
  new_teams: aggregate(2),
  new_users: aggregate(6),
  owner_memberships: [
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
    {
      team: {
        id: "team_multiple_owners",
        memberships_aggregate: aggregate(2),
        name: "Multiple owners",
      },
      user: {
        email: "second@example.com",
        id: "user_second",
        name: "Second owner",
      },
    },
  ],
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
  total_users: aggregate(11),
  users_without_teams: [
    {
      created_at: "2026-07-09T00:00:00.000Z",
      email: "unassigned@example.com",
      id: "user_without_team",
      name: "Unassigned user",
    },
  ],
  workflow_apps: [
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
