import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../../graphql/server/fetch-admin-user-details.generated";

export const fetchAdminUserDetails = async (userId: string) => {
  const client = await getInternalDashboardGraphqlClient();

  try {
    const data = await getSdk(client).FetchAdminUserDetails({ userId });

    if (!data.user_by_pk) {
      return null;
    }

    return {
      activeAppsCount: data.apps.aggregate?.count ?? 0,
      adminCount: data.admins.aggregate?.count ?? 0,
      deletedTeams: data.deleted_team_memberships.map(({ team }) => team),
      memberCount: data.members.aggregate?.count ?? 0,
      ownerCount: data.owners.aggregate?.count ?? 0,
      soleOwnerTeams: data.owner_memberships
        .filter(
          ({ team }) =>
            (team.memberships_aggregate.aggregate?.count ?? 0) === 1,
        )
        .map(({ team }) => team),
      teamsCount: data.memberships.aggregate?.count ?? 0,
      user: data.user_by_pk,
    };
  } catch (error) {
    logger.error("Failed to fetch admin user details", { error, userId });
    throw error;
  }
};
