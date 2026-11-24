import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../../graphql/server/fetch-admin-team-details.generated";

export const fetchAdminTeamDetails = async (teamId: string) => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminTeamDetails({ teamId });

    if (!data.team_by_pk) {
      return null;
    }

    return {
      apiKeys: data.api_key,
      appsCount: data.app_aggregate.aggregate?.count ?? 0,
      invites: data.invite,
      membersCount: data.membership_aggregate.aggregate?.count ?? 0,
      pendingInvitesCount: data.invite_aggregate.aggregate?.count ?? 0,
      activeApiKeysCount: data.api_key_aggregate.aggregate?.count ?? 0,
      team: data.team_by_pk,
    };
  } catch (error) {
    logger.error("Failed to fetch admin team details", { error, teamId });
    throw error;
  }
};
