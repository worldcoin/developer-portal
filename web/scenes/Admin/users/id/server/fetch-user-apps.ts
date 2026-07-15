import "server-only";

import {
  clampAppsPage,
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

type RawAdminUserApp = FetchAdminUserAppsQuery["app"][number];

export type AdminUserApp = Omit<RawAdminUserApp, "team"> & {
  team: Omit<RawAdminUserApp["team"], "name"> & { name: string };
};

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
    const sdk = getSdk(client);
    const countData = await sdk.FetchAdminUserApps({
      limit: 0,
      offset: 0,
      where,
    });
    const appsAmount =
      countData.app_aggregate.aggregate?.count ?? countData.app.length;
    const totalPages = getAppsTotalPages(appsAmount, USER_DETAIL_LIST_LIMIT);
    const currentPage = clampAppsPage(page, totalPages);
    const data = await sdk.FetchAdminUserApps({
      limit: currentPage * USER_DETAIL_LIST_LIMIT,
      offset: 0,
      where,
    });
    const apps: AdminUserApp[] = data.app.map((app) => ({
      ...app,
      team: {
        ...app.team,
        name: app.team.name ?? "Unnamed team",
      },
    }));

    return {
      apps,
      appsAmount,
      currentPage,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin user apps", { error, userId });
    throw error;
  }
};
