import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_USER_COLUMN_VISIBILITY,
  type UserColumnVisibility,
} from "@/components/AdminDashboard/Users/column-visibility";
import {
  DEFAULT_USERS_LIMIT,
  DEFAULT_USERS_PAGE,
  clampUsersPage,
  getUsersOffset,
  getUsersTotalPages,
  type UsersLimit,
} from "@/components/AdminDashboard/Users/pagination";
import {
  parseUsersSearchTokens,
  type ParsedUsersSearchToken,
  type UsersSearchOperator,
} from "@/components/AdminDashboard/Users/search";
import { parseDateSearchValue } from "@/components/AdminDashboard/common/search-tokens";
import {
  getEffectiveUsersSort,
  type UsersSort,
} from "@/components/AdminDashboard/Users/sorting";
import type { UserTableRow } from "@/components/AdminDashboard/Users/types";
import {
  Order_By,
  type User_Bool_Exp,
  type User_Order_By,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  FetchAdminUsersQuery,
  getSdk,
} from "../graphql/server/fetch-admin-users.generated";

const formatCreatedAt = (createdAt: string) => createdAt.slice(0, 10);

const getStringPredicate = (operator: UsersSearchOperator, value: string) => {
  if (operator === "!=") {
    return { _nilike: `%${value}%` };
  }

  if (operator === "=") {
    return { _eq: value };
  }

  return { _ilike: `%${value}%` };
};

const getNumberPredicate = (operator: UsersSearchOperator, value: string) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  if (operator === ">") {
    return { _gt: numberValue };
  }

  if (operator === ">=") {
    return { _gte: numberValue };
  }

  if (operator === "<") {
    return { _lt: numberValue };
  }

  if (operator === "<=") {
    return { _lte: numberValue };
  }

  if (operator === "!=") {
    return { _neq: numberValue };
  }

  return { _eq: numberValue };
};

const getDatePredicate = (operator: UsersSearchOperator, value: string) => {
  const date = parseDateSearchValue(value);

  if (!date) {
    return null;
  }

  if (operator === ">") {
    return { _gt: date };
  }

  if (operator === ">=") {
    return { _gte: date };
  }

  if (operator === "<") {
    return { _lt: date };
  }

  if (operator === "<=") {
    return { _lte: date };
  }

  if (operator === "!=") {
    return { _neq: date };
  }

  return { _eq: date };
};

const createFieldWhere = (
  token: Extract<ParsedUsersSearchToken, { type: "field" }>,
): User_Bool_Exp | null => {
  if (token.field === "id") {
    return { id: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "name") {
    return { name: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "email") {
    return { email: getStringPredicate(token.operator, token.value) };
  }

  if (token.field === "teams") {
    const predicate = getNumberPredicate(token.operator, token.value);
    return predicate
      ? { memberships_aggregate: { count: { predicate } } }
      : null;
  }

  if (token.field === "created") {
    const predicate = getDatePredicate(token.operator, token.value);

    return predicate ? { created_at: predicate } : { id: { _in: [] } };
  }

  return null;
};

export const createUsersWhere = (searchQuery: string): User_Bool_Exp => {
  if (!searchQuery) {
    return {};
  }

  const expressions = parseUsersSearchTokens(searchQuery)
    .map((token): User_Bool_Exp | null => {
      if (token.type === "plain") {
        return {
          _or: [
            { name: { _ilike: `%${token.value}%` } },
            { email: { _ilike: `%${token.value}%` } },
          ],
        };
      }

      return createFieldWhere(token);
    })
    .filter((expression): expression is User_Bool_Exp => Boolean(expression));

  if (expressions.length === 0) {
    return {};
  }

  return expressions.length === 1 ? expressions[0] : { _and: expressions };
};

const getHasuraSortDirection = (sort: UsersSort) =>
  sort.direction === "asc" ? Order_By.Asc : Order_By.Desc;

export const createUsersOrderBy = (sort: UsersSort | null): User_Order_By[] => {
  const effectiveSort = getEffectiveUsersSort(sort);
  const direction = getHasuraSortDirection(effectiveSort);

  if (effectiveSort.field === "name") {
    return [{ name: direction }, { id: Order_By.Asc }];
  }

  if (effectiveSort.field === "email") {
    return [{ email: direction }, { name: Order_By.Asc }, { id: Order_By.Asc }];
  }

  if (effectiveSort.field === "teamsCount") {
    return [
      { memberships_aggregate: { count: direction } },
      { name: Order_By.Asc },
      { id: Order_By.Asc },
    ];
  }

  if (effectiveSort.field === "createdAt") {
    return [
      { created_at: direction },
      { name: Order_By.Asc },
      { id: Order_By.Asc },
    ];
  }

  return [{ name: Order_By.Asc }, { id: Order_By.Asc }];
};

const mapUserToTableRow = (
  user: FetchAdminUsersQuery["user"][number],
  columnVisibility: UserColumnVisibility,
  teamsCountByUserId: ReadonlyMap<string, number>,
): UserTableRow => ({
  id: user.id,
  name: user.name ?? "Unnamed user",
  email: columnVisibility.email ? user.email : undefined,
  teamsCount: columnVisibility.teamsCount
    ? teamsCountByUserId.get(user.id) ?? 0
    : undefined,
  createdAt:
    columnVisibility.createdAt && user.created_at
      ? formatCreatedAt(user.created_at)
      : undefined,
});

type FetchAdminUsersOptions = {
  columnVisibility: UserColumnVisibility;
  limit: UsersLimit;
  page: number;
  searchQuery: string;
  sort: UsersSort | null;
};

export const fetchAdminUsersPage = async (
  {
    columnVisibility,
    limit,
    page,
    searchQuery,
    sort,
  }: FetchAdminUsersOptions = {
    columnVisibility: DEFAULT_USER_COLUMN_VISIBILITY,
    limit: DEFAULT_USERS_LIMIT,
    page: DEFAULT_USERS_PAGE,
    searchQuery: "",
    sort: null,
  },
) => {
  const client = await getInternalDashboardGraphqlClient();
  const offset = getUsersOffset(page, limit);
  const where = createUsersWhere(searchQuery);
  const orderBy = createUsersOrderBy(sort);

  try {
    const sdk = getSdk(client);
    const data = await sdk.FetchAdminUsers({
      includeCreatedAt: columnVisibility.createdAt,
      includeEmail: columnVisibility.email,
      limit,
      offset,
      orderBy,
      where,
    });
    const teamsCountByUserId = new Map<string, number>();

    if (columnVisibility.teamsCount && data.user.length > 0) {
      const memberships = await sdk.FetchAdminUserMemberships({
        userIds: data.user.map((user) => user.id),
      });

      for (const membership of memberships.membership) {
        teamsCountByUserId.set(
          membership.user_id,
          (teamsCountByUserId.get(membership.user_id) ?? 0) + 1,
        );
      }
    }

    const users = data.user.map((user) =>
      mapUserToTableRow(user, columnVisibility, teamsCountByUserId),
    );
    const usersAmount = data.user_aggregate.aggregate?.count ?? users.length;
    const totalPages = getUsersTotalPages(usersAmount, limit);
    const currentPage = clampUsersPage(page, totalPages);

    return { currentPage, totalPages, users, usersAmount };
  } catch (error) {
    logger.error("Failed to fetch admin users", { error });
    throw error;
  }
};
