import "server-only";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_TEAMS_LIMIT,
  DEFAULT_TEAMS_PAGE,
  clampTeamsPage,
  getTeamsOffset,
  getTeamsTotalPages,
  type TeamsLimit,
} from "@/components/AdminDashboard/Teams/pagination";
import {
  DEFAULT_TEAM_COLUMN_VISIBILITY,
  type TeamColumnVisibility,
} from "@/components/AdminDashboard/Teams/column-visibility";
import type { TeamTableRow } from "@/components/AdminDashboard/Teams/types";
import type { Team_Bool_Exp } from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  FetchAdminTeamsQuery,
  getSdk,
} from "../graphql/server/fetch-admin-teams.generated";

const formatCreatedAt = (createdAt: string) => {
  return createdAt.slice(0, 10);
};

const countByTeamId = (rows: Array<{ team_id: string }>) => {
  const countsByTeamId = new Map<string, number>();

  for (const row of rows) {
    const currentCount = countsByTeamId.get(row.team_id) ?? 0;
    countsByTeamId.set(row.team_id, currentCount + 1);
  }

  return countsByTeamId;
};

const createTeamsWhere = (searchQuery: string): Team_Bool_Exp => {
  if (!searchQuery) {
    return {};
  }

  const searchPattern = `%${searchQuery}%`;

  return {
    _or: [
      {
        name: {
          _ilike: searchPattern,
        },
      },
      {
        id: {
          _ilike: searchPattern,
        },
      },
    ],
  };
};

const mapTeamToTableRow = (
  team: FetchAdminTeamsQuery["team"][number],
  columnVisibility: TeamColumnVisibility,
  membersByTeamId: Map<string, number>,
  appsByTeamId: Map<string, number>,
  apiKeysByTeamId: Map<string, number>,
  pendingInvitesByTeamId: Map<string, number>,
): TeamTableRow => {
  return {
    id: team.id,
    name: team.name ?? "Unnamed team",
    status: columnVisibility.status
      ? team.deleted_at
        ? "Deleted"
        : "Active"
      : undefined,
    membersCount: membersByTeamId.get(team.id) ?? 0,
    appsCount: appsByTeamId.get(team.id) ?? 0,
    pendingInvitesCount: pendingInvitesByTeamId.get(team.id) ?? 0,
    activeApiKeysCount: apiKeysByTeamId.get(team.id) ?? 0,
    createdAt:
      columnVisibility.createdAt && team.created_at
        ? formatCreatedAt(team.created_at)
        : undefined,
  };
};

type FetchAdminTeamsOptions = {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
  searchQuery: string;
};

export const fetchAdminTeamsPage = async ({
  columnVisibility,
  limit,
  page,
  searchQuery,
}: FetchAdminTeamsOptions = {
  columnVisibility: DEFAULT_TEAM_COLUMN_VISIBILITY,
  limit: DEFAULT_TEAMS_LIMIT,
  page: DEFAULT_TEAMS_PAGE,
  searchQuery: "",
}) => {
  const client = await getAPIServiceGraphqlClient();
  const offset = getTeamsOffset(page, limit);
  const where = createTeamsWhere(searchQuery);

  try {
    const data = await getSdk(client).FetchAdminTeams({
      includeActiveApiKeysCount: columnVisibility.activeApiKeysCount,
      includeAppsCount: columnVisibility.appsCount,
      includeCreatedAt: columnVisibility.createdAt,
      includeMembersCount: columnVisibility.membersCount,
      includePendingInvitesCount: columnVisibility.pendingInvitesCount,
      includeStatus: columnVisibility.status,
      limit,
      offset,
      where,
    });

    const membersByTeamId = countByTeamId(data.membership ?? []);
    const appsByTeamId = countByTeamId(data.app ?? []);
    const apiKeysByTeamId = countByTeamId(data.api_key ?? []);
    const pendingInvitesByTeamId = countByTeamId(data.invite ?? []);

    const teams = data.team.map((team) =>
      mapTeamToTableRow(
        team,
        columnVisibility,
        membersByTeamId,
        appsByTeamId,
        apiKeysByTeamId,
        pendingInvitesByTeamId,
      ),
    );

    const teamsAmount = data.team_aggregate.aggregate?.count ?? teams.length;
    const totalPages = getTeamsTotalPages(teamsAmount, limit);
    const currentPage = clampTeamsPage(page, totalPages);

    return {
      teams,
      teamsAmount,
      currentPage,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin teams", { error });
    throw error;
  }
};
