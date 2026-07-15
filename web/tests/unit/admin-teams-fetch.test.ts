const mockFetchAdminTeams = jest.fn();
const mockFetchAdminTeamPendingInvites = jest.fn();

jest.mock("server-only", () => ({}));

jest.mock("@/api/helpers/graphql", () => ({
  getInternalDashboardGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/scenes/Admin/teams/graphql/server/fetch-admin-teams.generated",
  () => ({
    getSdk: () => ({
      FetchAdminTeams: mockFetchAdminTeams,
      FetchAdminTeamPendingInvites: mockFetchAdminTeamPendingInvites,
    }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { DEFAULT_TEAM_COLUMN_VISIBILITY } from "@/components/AdminDashboard/Teams/column-visibility";
import {
  createTeamsWhere,
  fetchAdminTeamsPage,
} from "@/scenes/Admin/teams/server/fetch-teams";

const makeTeam = (id: string) => ({
  id,
  name: `Team ${id}`,
  created_at: "2026-07-14T10:00:00.000Z",
  deleted_at: null,
  memberships_aggregate: {
    aggregate: {
      count: 3,
    },
  },
  apps_aggregate: {
    aggregate: {
      count: 2,
    },
  },
  api_keys_aggregate: {
    aggregate: {
      count: 4,
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchAdminTeams.mockResolvedValue({
    team: [makeTeam("team-1"), makeTeam("team-2")],
    team_aggregate: {
      aggregate: {
        count: 2,
      },
    },
  });
});

describe("admin teams metric queries", () => {
  it("returns no matches for unknown statuses and invalid dates", () => {
    expect(createTeamsWhere("status:archived")).toEqual({ id: { _in: [] } });
    expect(createTeamsWhere("status!=archived")).toEqual({ id: { _in: [] } });
    expect(createTeamsWhere("created>=invalid")).toEqual({ id: { _in: [] } });
  });

  it("uses relationship aggregates and scopes invites to the current page", async () => {
    mockFetchAdminTeamPendingInvites.mockResolvedValue({
      invite: [
        { team_id: "team-1" },
        { team_id: "team-1" },
        { team_id: "team-2" },
      ],
    });

    const result = await fetchAdminTeamsPage();

    expect(mockFetchAdminTeamPendingInvites).toHaveBeenCalledWith({
      teamIds: ["team-1", "team-2"],
    });
    expect(result.teams).toEqual([
      expect.objectContaining({
        id: "team-1",
        membersCount: 3,
        appsCount: 2,
        activeApiKeysCount: 4,
        pendingInvitesCount: 2,
      }),
      expect.objectContaining({
        id: "team-2",
        membersCount: 3,
        appsCount: 2,
        activeApiKeysCount: 4,
        pendingInvitesCount: 1,
      }),
    ]);
  });

  it("skips the invite query when the metric column is hidden", async () => {
    const result = await fetchAdminTeamsPage({
      columnVisibility: {
        ...DEFAULT_TEAM_COLUMN_VISIBILITY,
        pendingInvitesCount: false,
      },
      limit: 25,
      page: 1,
      searchQuery: "",
      sort: null,
    });

    expect(mockFetchAdminTeamPendingInvites).not.toHaveBeenCalled();
    expect(result.teams.map((team) => team.pendingInvitesCount)).toEqual([
      0, 0,
    ]);
  });
});
