const mockFetchAdminHome = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: async () => ({}),
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

const createHomeResponse = () => ({
  inventory: [
    {
      active_api_keys: 3,
      active_apps: 7,
      active_teams: 5,
      deleted_apps: 2,
      deleted_teams: 1,
      new_apps: 4,
      new_teams: 2,
      new_users: 6,
      pending_invites: 2,
      total_users: 11,
    },
  ],
  queues: [
    {
      id: "app_waiting_review",
      kind: "apps_awaiting_review",
      name: "Waiting app",
      team_id: "team_current",
      total_count: 7,
      updated_at: "2026-07-09T00:00:00.000Z",
    },
    {
      id: "app_changes_requested",
      kind: "apps_changes_requested",
      name: "Reviewed app",
      team_id: "team_current",
      total_count: 8,
      updated_at: "2026-07-10T00:00:00.000Z",
    },
    {
      id: "app_without_metadata",
      kind: "apps_without_metadata",
      name: "Missing metadata",
      team_id: "team_current",
      total_count: 9,
    },
    {
      id: "team_without_owner",
      kind: "teams_without_owner",
      name: "No owner team",
      total_count: 11,
    },
    {
      id: "team_sole_owner",
      kind: "sole_owner_teams",
      name: "Sole owner team",
      owner_email: "owner@example.com",
      owner_id: "user_owner",
      owner_name: "Owner",
      total_count: 10,
    },
    {
      email: "unassigned@example.com",
      id: "user_without_team",
      kind: "users_without_teams",
      name: "Unassigned user",
      total_count: 12,
    },
  ],
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
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("admin home fetch", () => {
  it("maps typed queue rows into the dashboard contract", async () => {
    mockFetchAdminHome.mockResolvedValue(createHomeResponse());

    const home = await fetchAdminHome();

    expect(mockFetchAdminHome).toHaveBeenCalledWith({ recentLimit: 5 });
    expect(home.queues.appsAwaitingReview).toEqual([
      expect.objectContaining({ id: "app_waiting_review" }),
    ]);
    expect(home.queues.soleOwnerTeams).toEqual([
      expect.objectContaining({ id: "team_sole_owner" }),
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

  it("returns zero for an empty queue", async () => {
    const response = createHomeResponse();
    response.queues = response.queues.filter(
      (queue) => queue.kind !== "apps_awaiting_review",
    );
    mockFetchAdminHome.mockResolvedValue(response);

    const home = await fetchAdminHome();

    expect(home.queueCounts.appsAwaitingReview).toBe(0);
  });

  it("coerces stringified bigint inventory counts before UI math", async () => {
    const response = createHomeResponse();
    response.inventory[0] = {
      active_api_keys: "200" as unknown as number,
      active_apps: "120510" as unknown as number,
      active_teams: "120502" as unknown as number,
      deleted_apps: "100" as unknown as number,
      deleted_teams: "100" as unknown as number,
      new_apps: "120500" as unknown as number,
      new_teams: "120500" as unknown as number,
      new_users: "120500" as unknown as number,
      pending_invites: "300" as unknown as number,
      total_users: "120506" as unknown as number,
    };
    response.queues[0] = {
      ...response.queues[0],
      total_count: "7" as unknown as number,
    };
    mockFetchAdminHome.mockResolvedValue(response);

    const home = await fetchAdminHome();

    expect(home.inventory.activeTeams + home.inventory.deletedTeams).toBe(
      120602,
    );
    expect(home.inventory.activeApps + home.inventory.deletedApps).toBe(
      120610,
    );
    expect(home.queueCounts.appsAwaitingReview).toBe(7);
  });

  it("prioritizes current draft metadata", () => {
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
