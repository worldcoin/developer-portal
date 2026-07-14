import "server-only";

import {
  clampAppsPage,
  getAppsOffset,
  getAppsTotalPages,
} from "@/components/AdminDashboard/Apps/pagination";
import { createAppsWhere } from "@/scenes/Admin/apps/server/fetch-apps";
import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import type { App_Bool_Exp } from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  getSdk,
  type FetchAdminUserAppsQuery,
} from "../../graphql/server/fetch-admin-user-apps.generated";

export const USER_DETAIL_LIST_LIMIT = 10;

export const createAdminUserAppsWhere = (
  userId: string,
  searchQuery: string,
): App_Bool_Exp => ({
  _and: [
    { team: { memberships: { user_id: { _eq: userId } } } },
    createAppsWhere(searchQuery),
  ],
});

export type AdminUserApp = FetchAdminUserAppsQuery["app"][number];

export const fetchAdminUserAppsPage = async ({
  page,
  searchQuery,
  userId,
}: {
  page: number;
  searchQuery: string;
  userId: string;
}) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createAdminUserAppsWhere(userId, searchQuery);

  try {
    const data = await getSdk(client).FetchAdminUserApps({
      limit: USER_DETAIL_LIST_LIMIT,
      offset: getAppsOffset(page, USER_DETAIL_LIST_LIMIT),
      where,
    });
    const appsAmount = data.app_aggregate.aggregate?.count ?? data.app.length;
    const totalPages = getAppsTotalPages(appsAmount, USER_DETAIL_LIST_LIMIT);

    return {
      apps: data.app,
      appsAmount,
      currentPage: clampAppsPage(page, totalPages),
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin user apps", { error, userId });
    throw error;
  }
};
