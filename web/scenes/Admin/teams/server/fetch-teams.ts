import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_TEAM_COLUMN_VISIBILITY,
  type TeamColumnVisibility,
} from "@/components/AdminDashboard/Teams/column-visibility";
import {
  DEFAULT_TEAMS_LIMIT,
  DEFAULT_TEAMS_PAGE,
  clampTeamsPage,
  getTeamsOffset,
  getTeamsTotalPages,
  type TeamsLimit,
} from "@/components/AdminDashboard/Teams/pagination";
import {
  parseTeamsSearchTokens,
  type ParsedTeamsSearchToken,
  type TeamsSearchOperator,
} from "@/components/AdminDashboard/Teams/search";
import {
  getEffectiveTeamsSort,
  type TeamsSort,
} from "@/components/AdminDashboard/Teams/sorting";
import type { TeamTableRow } from "@/components/AdminDashboard/Teams/types";
import {
  Order_By,
  type Team_Bool_Exp,
  type Team_Order_By,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  FetchAdminTeamsQuery,
  getSdk,
} from "../graphql/server/fetch-admin-teams.generated";

const formatCreatedAt = (createdAt: string) => {
  return createdAt.slice(0, 10);
};

const countByTeamId = (rows: Array<{ team_id: string }>) => {
  const countsByTeamId = new Map<string, number>();

  for (const row of rows) {
    const currentCount = countsByTeamId.get(row.team_id) ?? 0;
    countsByTeamId.set(row.team_id, currentCount + 1);
  }

  return countsByTeamId;
};

const getStringPredicate = (operator: TeamsSearchOperator, value: string) => {
  if (operator === "!=") {
    return {
      _nilike: `%${value}%`,
    };
  }

  if (operator === "=") {
    return {
      _eq: value,
    };
  }

  return {
    _ilike: `%${value}%`,
  };
};

const getNumberPredicate = (operator: TeamsSearchOperator, value: string) => {
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

const getDatePredicate = (operator: TeamsSearchOperator, value: string) => {
  if (operator === ">") {
    return { _gt: value };
  }

  if (operator === ">=") {
    return { _gte: value };
  }

  if (operator === "<") {
    return { _lt: value };
  }

  if (operator === "<=") {
    return { _lte: value };
  }

  if (operator === "!=") {
    return { _neq: value };
  }

  return { _eq: value };
};

const getCountAggregatePredicate = (
  operator: TeamsSearchOperator,
  value: string,
  filter?: object,
) => {
  const predicate = getNumberPredicate(operator, value);

  if (!predicate) {
    return null;
  }

  return {
    count: {
      ...(filter ? { filter } : {}),
      predicate,
    },
  };
};

const createFieldWhere = (
  token: Extract<ParsedTeamsSearchToken, { type: "field" }>,
): Team_Bool_Exp | null => {
  if (token.field === "id") {
    return {
      id: getStringPredicate(token.operator, token.value),
    };
  }

  if (token.field === "name") {
    return {
      name: getStringPredicate(token.operator, token.value),
    };
  }

  if (token.field === "status") {
    const isDeleted = token.value.toLowerCase() === "deleted";
    const shouldMatchDeleted = token.operator === "!=" ? !isDeleted : isDeleted;

    return {
      deleted_at: shouldMatchDeleted ? { _is_null: false } : { _is_null: true },
    };
  }

  if (token.field === "created") {
    return {
      created_at: getDatePredicate(token.operator, token.value),
    };
  }

  if (token.field === "members") {
    const predicate = getCountAggregatePredicate(token.operator, token.value);

    return predicate ? { memberships_aggregate: predicate } : null;
  }

  if (token.field === "apps") {
    const predicate = getCountAggregatePredicate(token.operator, token.value, {
      deleted_at: {
        _is_null: true,
      },
    });

    return predicate ? { apps_aggregate: predicate } : null;
  }

  if (token.field === "api_keys") {
    const predicate = getCountAggregatePredicate(token.operator, token.value, {
      is_active: {
        _eq: true,
      },
    });

    return predicate ? { api_keys_aggregate: predicate } : null;
  }

  return null;
};

const createTeamsWhere = (searchQuery: string): Team_Bool_Exp => {
  if (!searchQuery) {
    return {};
  }

  const expressions = parseTeamsSearchTokens(searchQuery)
    .map((token) => {
      if (token.type === "plain") {
        return {
          name: {
            _ilike: `%${token.value}%`,
          },
        };
      }

      return createFieldWhere(token);
    })
    .filter((expression): expression is Team_Bool_Exp => Boolean(expression));

  if (expressions.length === 0) {
    return {};
  }

  if (expressions.length === 1) {
    return expressions[0];
  }

  return {
    _and: expressions,
  };
};

const getHasuraSortDirection = (sort: TeamsSort) => {
  return sort.direction === "asc" ? Order_By.Asc : Order_By.Desc;
};

const createTeamsOrderBy = (sort: TeamsSort | null): Team_Order_By[] => {
  const effectiveSort = getEffectiveTeamsSort(sort);
  const direction = getHasuraSortDirection(effectiveSort);

  if (effectiveSort.field === "name") {
    return [{ name: direction }];
  }

  if (effectiveSort.field === "status") {
    return [
      {
        deleted_at:
          effectiveSort.direction === "asc"
            ? Order_By.AscNullsFirst
            : Order_By.DescNullsLast,
      },
      { name: Order_By.Asc },
    ];
  }

  if (effectiveSort.field === "membersCount") {
    return [
      { memberships_aggregate: { count: direction } },
      { name: Order_By.Asc },
    ];
  }

  if (effectiveSort.field === "createdAt") {
    return [{ created_at: direction }, { name: Order_By.Asc }];
  }

  return [{ name: Order_By.Asc }];
};

const mapTeamToTableRow = (
  team: FetchAdminTeamsQuery["team"][number],
  columnVisibility: TeamColumnVisibility,
  pendingInvitesByTeamId: Map<string, number>,
): TeamTableRow => {
  return {
    id: team.id,
    name: team.name ?? "Unnamed team",
    status: columnVisibility.status
      ? team.deleted_at
        ? "Deleted"
        : "Active"
      : undefined,
    membersCount: team.memberships_aggregate?.aggregate?.count ?? 0,
    appsCount: team.apps_aggregate?.aggregate?.count ?? 0,
    pendingInvitesCount: pendingInvitesByTeamId.get(team.id) ?? 0,
    activeApiKeysCount: team.api_keys_aggregate?.aggregate?.count ?? 0,
    createdAt:
      columnVisibility.createdAt && team.created_at
        ? formatCreatedAt(team.created_at)
        : undefined,
  };
};

type FetchAdminTeamsOptions = {
  columnVisibility: TeamColumnVisibility;
  limit: TeamsLimit;
  page: number;
  searchQuery: string;
  sort: TeamsSort | null;
};

export const fetchAdminTeamsPage = async (
  {
    columnVisibility,
    limit,
    page,
    searchQuery,
    sort,
  }: FetchAdminTeamsOptions = {
    columnVisibility: DEFAULT_TEAM_COLUMN_VISIBILITY,
    limit: DEFAULT_TEAMS_LIMIT,
    page: DEFAULT_TEAMS_PAGE,
    searchQuery: "",
    sort: null,
  },
) => {
  const client = await getInternalDashboardGraphqlClient();
  const offset = getTeamsOffset(page, limit);
  const where = createTeamsWhere(searchQuery);
  const orderBy = createTeamsOrderBy(sort);

  try {
    const sdk = getSdk(client);
    const data = await sdk.FetchAdminTeams({
      includeActiveApiKeysCount: columnVisibility.activeApiKeysCount,
      includeAppsCount: columnVisibility.appsCount,
      includeCreatedAt: columnVisibility.createdAt,
      includeMembersCount: columnVisibility.membersCount,
      includeStatus: columnVisibility.status,
      limit,
      offset,
      orderBy,
      where,
    });

    const pendingInvitesByTeamId =
      columnVisibility.pendingInvitesCount && data.team.length > 0
        ? countByTeamId(
            (
              await sdk.FetchAdminTeamPendingInvites({
                teamIds: data.team.map((team) => team.id),
              })
            ).invite,
          )
        : new Map<string, number>();

    const teams = data.team.map((team) =>
      mapTeamToTableRow(team, columnVisibility, pendingInvitesByTeamId),
    );

    const teamsAmount = data.team_aggregate.aggregate?.count ?? teams.length;
    const totalPages = getTeamsTotalPages(teamsAmount, limit);
    const currentPage = clampTeamsPage(page, totalPages);

    return {
      teams,
      teamsAmount,
      currentPage,
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin teams", { error });
    throw error;
  }
};
