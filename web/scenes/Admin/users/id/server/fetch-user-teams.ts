import "server-only";

import {
  clampUsersPage,
  getUsersTotalPages,
} from "@/components/AdminDashboard/Users/pagination";
import { parseSingleSearchToken } from "@/components/AdminDashboard/common/search-tokens";
import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import type { Membership_Bool_Exp, Role_Enum } from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  getSdk,
  type FetchAdminUserTeamsQuery,
} from "../../graphql/server/fetch-admin-user-teams.generated";
import { USER_DETAIL_LIST_LIMIT } from "./fetch-user-apps";

const roleValues = ["ADMIN", "MEMBER", "OWNER"] as const;
const teamSearchFields = {
  id: "id",
  name: "name",
  role: "role",
  status: "status",
} as const;

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

  const { field, value } = parseSingleSearchToken(search, teamSearchFields);

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

type RawAdminUserTeam = FetchAdminUserTeamsQuery["membership"][number];

export type AdminUserTeam = Omit<RawAdminUserTeam, "team"> & {
  team: Omit<RawAdminUserTeam["team"], "name"> & { name: string };
};

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
    const sdk = getSdk(client);
    const countData = await sdk.FetchAdminUserTeams({
      limit: 0,
      offset: 0,
      where,
    });
    const teamsAmount =
      countData.membership_aggregate.aggregate?.count ??
      countData.membership.length;
    const totalPages = getUsersTotalPages(teamsAmount, USER_DETAIL_LIST_LIMIT);
    const currentPage = clampUsersPage(page, totalPages);
    const data = await sdk.FetchAdminUserTeams({
      limit: currentPage * USER_DETAIL_LIST_LIMIT,
      offset: 0,
      where,
    });
    const teams: AdminUserTeam[] = data.membership.map((membership) => ({
      ...membership,
      team: {
        ...membership.team,
        name: membership.team.name ?? "Unnamed team",
      },
    }));

    return {
      currentPage,
      teams,
      teamsAmount,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin user teams", { error, userId });
    throw error;
  }
};
