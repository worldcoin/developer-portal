import "server-only";

import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import type { AdminUser } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

import {
  createGlobalSearchQuery,
  type GlobalSearchTarget,
} from "./create-global-search-where";
import { getSdk } from "../graphql/server/fetch-admin-global-search.generated";

export type GlobalSearchResult = {
  apps: Array<{ id: string; name: string; teamId: string }>;
  query: string;
  teams: Array<{ id: string; name: string }>;
  totals: Record<GlobalSearchTarget, number>;
  users: Array<{ email: string | null; id: string; name: string }>;
};

const getCount = (aggregate?: { aggregate?: { count: number } | null }) =>
  aggregate?.aggregate?.count ?? 0;

export const fetchAdminGlobalSearch = async (
  query: string,
  user: AdminUser,
): Promise<GlobalSearchResult> => {
  const trimmedQuery = query.trim();
  const { appsWhere, targets, teamsWhere, usersWhere } =
    createGlobalSearchQuery(trimmedQuery);
  const client = await getInternalDashboardGraphqlClientForUser(user);

  try {
    const data = await getSdk(client).FetchAdminGlobalSearch({
      appsWhere,
      includeApps: targets.has("apps"),
      includeTeams: targets.has("teams"),
      includeUsers: targets.has("users"),
      limit: 5,
      teamsWhere,
      usersWhere,
    });

    return {
      apps: (data.apps ?? []).map((app) => ({
        id: app.id,
        name: app.name,
        teamId: app.team_id,
      })),
      query: trimmedQuery,
      teams: (data.teams ?? []).map((team) => ({
        id: team.id,
        name: team.name ?? "Unnamed team",
      })),
      totals: {
        apps: getCount(data.apps_aggregate),
        teams: getCount(data.teams_aggregate),
        users: getCount(data.users_aggregate),
      },
      users: (data.users ?? []).map((resultUser) => ({
        email: resultUser.email ?? null,
        id: resultUser.id,
        name: resultUser.name,
      })),
    };
  } catch (error) {
    logger.error("Failed to fetch admin global search results", {
      error,
      query: trimmedQuery,
      subject: user.subject,
    });
    throw error;
  }
};
