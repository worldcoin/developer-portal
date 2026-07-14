import "server-only";

import {
  clampUsersPage,
  getUsersOffset,
  getUsersTotalPages,
} from "@/components/AdminDashboard/Users/pagination";
import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import type { Membership_Bool_Exp, Role_Enum } from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  getSdk,
  type FetchAdminUserTeamsQuery,
} from "../../graphql/server/fetch-admin-user-teams.generated";
import { USER_DETAIL_LIST_LIMIT } from "./fetch-user-apps";

const roleValues = ["ADMIN", "MEMBER", "OWNER"] as const;

const getSearchPredicate = (value: string) => ({ _ilike: `%${value}%` });

export const createAdminUserTeamsWhere = (
  userId: string,
  searchQuery: string,
): Membership_Bool_Exp => {
  const scope = { user_id: { _eq: userId } };
  const search = searchQuery.trim();

  if (!search) {
    return scope;
  }

  const fieldMatch = search.match(/^(id|name|role|status):(.+)$/i);
  const [, field, rawValue] = fieldMatch ?? [];
  const value = rawValue?.trim() ?? search;

  if (field === "role") {
    const role = value.toUpperCase();

    return {
      _and: [
        scope,
        roleValues.includes(role as Role_Enum)
          ? { role: { _eq: role as Role_Enum } }
          : { team_id: { _in: [] } },
      ],
    };
  }

  if (field === "status") {
    const status = value.toLowerCase();

    return {
      _and: [
        scope,
        status === "active"
          ? { team: { deleted_at: { _is_null: true } } }
          : status === "deleted"
            ? { team: { deleted_at: { _is_null: false } } }
            : { team_id: { _in: [] } },
      ],
    };
  }

  const searchWhere: Membership_Bool_Exp =
    field === "id"
      ? { team_id: getSearchPredicate(value) }
      : field === "name"
        ? { team: { name: getSearchPredicate(value) } }
        : {
            _or: [
              { team_id: getSearchPredicate(value) },
              { team: { name: getSearchPredicate(value) } },
            ],
          };

  return { _and: [scope, searchWhere] };
};

export type AdminUserTeam = FetchAdminUserTeamsQuery["membership"][number];

export const fetchAdminUserTeamsPage = async ({
  page,
  searchQuery,
  userId,
}: {
  page: number;
  searchQuery: string;
  userId: string;
}) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createAdminUserTeamsWhere(userId, searchQuery);

  try {
    const data = await getSdk(client).FetchAdminUserTeams({
      limit: USER_DETAIL_LIST_LIMIT,
      offset: getUsersOffset(page, USER_DETAIL_LIST_LIMIT),
      where,
    });
    const teamsAmount =
      data.membership_aggregate.aggregate?.count ?? data.membership.length;
    const totalPages = getUsersTotalPages(teamsAmount, USER_DETAIL_LIST_LIMIT);

    return {
      currentPage: clampUsersPage(page, totalPages),
      teams: data.membership,
      teamsAmount,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin user teams", { error, userId });
    throw error;
  }
};
