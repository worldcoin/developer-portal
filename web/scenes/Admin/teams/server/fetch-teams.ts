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
import type { TeamTableRow } from "@/components/AdminDashboard/Teams/types";
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

const mapTeamToTableRow = (
  team: FetchAdminTeamsQuery["team"][number],
  membersByTeamId: Map<string, number>,
  appsByTeamId: Map<string, number>,
  apiKeysByTeamId: Map<string, number>,
  pendingInvitesByTeamId: Map<string, number>,
): TeamTableRow => {
  return {
    id: team.id,
    name: team.name ?? "Unnamed team",
    status: team.deleted_at ? "Deleted" : "Active",
    membersCount: membersByTeamId.get(team.id) ?? 0,
    appsCount: appsByTeamId.get(team.id) ?? 0,
    pendingInvitesCount: pendingInvitesByTeamId.get(team.id) ?? 0,
    activeApiKeysCount: apiKeysByTeamId.get(team.id) ?? 0,
    createdAt: formatCreatedAt(team.created_at),
  };
};

type FetchAdminTeamsOptions = {
  limit: TeamsLimit;
  page: number;
};

export const fetchAdminTeamsPage = async ({
  limit,
  page,
}: FetchAdminTeamsOptions = {
  limit: DEFAULT_TEAMS_LIMIT,
  page: DEFAULT_TEAMS_PAGE,
}) => {
  const client = await getAPIServiceGraphqlClient();
  const offset = getTeamsOffset(page, limit);

  try {
    const data = await getSdk(client).FetchAdminTeams({ limit, offset });

    const membersByTeamId = countByTeamId(data.membership);
    const appsByTeamId = countByTeamId(data.app);
    const apiKeysByTeamId = countByTeamId(data.api_key);
    const pendingInvitesByTeamId = countByTeamId(data.invite);

    const teams = data.team.map((team) =>
      mapTeamToTableRow(
        team,
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
