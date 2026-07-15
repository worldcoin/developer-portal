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
  type FetchAdminTeamMembersQuery,
} from "../../graphql/server/fetch-admin-team-members.generated";

import { TEAM_DETAIL_LIST_LIMIT } from "./fetch-team-apps";

const getSearchPredicate = (value: string) => ({ _ilike: `%${value}%` });
const roleValues = ["ADMIN", "MEMBER", "OWNER"] as const;

export const createAdminTeamMembersWhere = (
  teamId: string,
  searchQuery: string,
): Membership_Bool_Exp => {
  const search = searchQuery.trim();

  if (!search) {
    return { team_id: { _eq: teamId } };
  }

  const fieldMatch = search.match(/^(id|name|email|role):(.+)$/i);
  const [, field, rawValue] = fieldMatch ?? [];
  const value = rawValue?.trim() ?? search;
  const role = value.toUpperCase();
  const isRole = roleValues.includes(role as Role_Enum);

  if (field === "role") {
    if (!isRole) {
      return {
        _and: [{ team_id: { _eq: teamId } }, { user_id: { _in: [] } }],
      };
    }

    return {
      _and: [
        { team_id: { _eq: teamId } },
        { role: { _eq: role as Role_Enum } },
      ],
    };
  }

  let searchWhere: Membership_Bool_Exp;

  if (field === "id") {
    searchWhere = { user_id: getSearchPredicate(value) };
  } else if (field === "name") {
    searchWhere = { user: { name: getSearchPredicate(value) } };
  } else if (field === "email") {
    searchWhere = { user: { email: getSearchPredicate(value) } };
  } else {
    searchWhere = {
      _or: [
        { user_id: getSearchPredicate(value) },
        { user: { name: getSearchPredicate(value) } },
        { user: { email: getSearchPredicate(value) } },
      ],
    };
  }

  return {
    _and: [{ team_id: { _eq: teamId } }, searchWhere],
  };
};

export type AdminTeamMember = FetchAdminTeamMembersQuery["membership"][number];

export const fetchAdminTeamMembersPage = async ({
  page,
  searchQuery,
  teamId,
}: {
  page: number;
  searchQuery: string;
  teamId: string;
}) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createAdminTeamMembersWhere(teamId, searchQuery);

  try {
    const data = await getSdk(client).FetchAdminTeamMembers({
      limit: TEAM_DETAIL_LIST_LIMIT,
      offset: getUsersOffset(page, TEAM_DETAIL_LIST_LIMIT),
      where,
    });
    const membersAmount =
      data.membership_aggregate.aggregate?.count ?? data.membership.length;
    const totalPages = getUsersTotalPages(
      membersAmount,
      TEAM_DETAIL_LIST_LIMIT,
    );

    return {
      currentPage: clampUsersPage(page, totalPages),
      members: data.membership,
      membersAmount,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin team members", { error, teamId });
    throw error;
  }
};
