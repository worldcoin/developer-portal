import "server-only";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_TEAMS_LIMIT,
  DEFAULT_TEAMS_PAGE,
  clampTeamsPage,
  getTeamsOffset,
  getTeamsTotalPages,
  type TeamsLimit,
} from "@/components/AdminDashboard/Teams/pagination";
import {
  DEFAULT_TEAM_COLUMN_VISIBILITY,
  type TeamColumnVisibility,
} from "@/components/AdminDashboard/Teams/column-visibility";
import {
  parseTeamsSearchTokens,
  type ParsedTeamsSearchToken,
  type TeamsSearchOperator,
} from "@/components/AdminDashboard/Teams/search";
import type { TeamTableRow } from "@/components/AdminDashboard/Teams/types";
import type { Team_Bool_Exp } from "@/graphql/graphql";
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
    const shouldMatchDeleted =
      token.operator === "!=" ? !isDeleted : isDeleted;

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

const mapTeamToTableRow = (
  team: FetchAdminTeamsQuery["team"][number],
  columnVisibility: TeamColumnVisibility,
  membersByTeamId: Map<string, number>,
  appsByTeamId: Map<string, number>,
  apiKeysByTeamId: Map<string, number>,
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
    membersCount: membersByTeamId.get(team.id) ?? 0,
    appsCount: appsByTeamId.get(team.id) ?? 0,
    pendingInvitesCount: pendingInvitesByTeamId.get(team.id) ?? 0,
    activeApiKeysCount: apiKeysByTeamId.get(team.id) ?? 0,
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
};

export const fetchAdminTeamsPage = async ({
  columnVisibility,
  limit,
  page,
  searchQuery,
}: FetchAdminTeamsOptions = {
  columnVisibility: DEFAULT_TEAM_COLUMN_VISIBILITY,
  limit: DEFAULT_TEAMS_LIMIT,
  page: DEFAULT_TEAMS_PAGE,
  searchQuery: "",
}) => {
  const client = await getAPIServiceGraphqlClient();
  const offset = getTeamsOffset(page, limit);
  const where = createTeamsWhere(searchQuery);

  try {
    const data = await getSdk(client).FetchAdminTeams({
      includeActiveApiKeysCount: columnVisibility.activeApiKeysCount,
      includeAppsCount: columnVisibility.appsCount,
      includeCreatedAt: columnVisibility.createdAt,
      includeMembersCount: columnVisibility.membersCount,
      includePendingInvitesCount: columnVisibility.pendingInvitesCount,
      includeStatus: columnVisibility.status,
      limit,
      offset,
      where,
    });

    const membersByTeamId = countByTeamId(data.membership ?? []);
    const appsByTeamId = countByTeamId(data.app ?? []);
    const apiKeysByTeamId = countByTeamId(data.api_key ?? []);
    const pendingInvitesByTeamId = countByTeamId(data.invite ?? []);

    const teams = data.team.map((team) =>
      mapTeamToTableRow(
        team,
        columnVisibility,
        membersByTeamId,
        appsByTeamId,
        apiKeysByTeamId,
        pendingInvitesByTeamId,
      ),
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
