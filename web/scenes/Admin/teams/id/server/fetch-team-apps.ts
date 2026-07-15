import "server-only";

import {
  clampAppsPage,
  getAppsTotalPages,
} from "@/components/AdminDashboard/Apps/pagination";
import { createAppsWhere } from "@/scenes/Admin/apps/server/fetch-apps";
import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import type { App_Bool_Exp } from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import { getSdk } from "../../graphql/server/fetch-admin-team-apps.generated";

export const TEAM_DETAIL_LIST_LIMIT = 10;

export const createAdminTeamAppsWhere = (
  teamId: string,
  searchQuery: string,
): App_Bool_Exp => ({
  _and: [{ team_id: { _eq: teamId } }, createAppsWhere(searchQuery)],
});

export const fetchAdminTeamAppsPage = async ({
  page,
  searchQuery,
  teamId,
}: {
  page: number;
  searchQuery: string;
  teamId: string;
}) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createAdminTeamAppsWhere(teamId, searchQuery);

  try {
    const sdk = getSdk(client);
    const countData = await sdk.FetchAdminTeamApps({
      limit: 0,
      offset: 0,
      where,
    });
    const appsAmount =
      countData.app_aggregate.aggregate?.count ?? countData.app.length;
    const totalPages = getAppsTotalPages(appsAmount, TEAM_DETAIL_LIST_LIMIT);
    const currentPage = clampAppsPage(page, totalPages);
    const data = await sdk.FetchAdminTeamApps({
      limit: currentPage * TEAM_DETAIL_LIST_LIMIT,
      offset: 0,
      where,
    });

    return {
      apps: data.app,
      appsAmount,
      currentPage,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin team apps", { error, teamId });
    throw error;
  }
};
