import "server-only";

import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import {
  DEFAULT_APP_COLUMN_VISIBILITY,
  type AppColumnVisibility,
} from "@/components/AdminDashboard/Apps/column-visibility";
import {
  clampAppsPage,
  DEFAULT_APPS_LIMIT,
  DEFAULT_APPS_PAGE,
  getAppsOffset,
  getAppsTotalPages,
  type AppsLimit,
} from "@/components/AdminDashboard/Apps/pagination";
import {
  parseAppsSearchTokens,
  type AppsSearchOperator,
  type ParsedAppsSearchToken,
} from "@/components/AdminDashboard/Apps/search";
import { parseDateSearchValue } from "@/components/AdminDashboard/common/search-tokens";
import {
  getEffectiveAppsSort,
  type AppsSort,
} from "@/components/AdminDashboard/Apps/sorting";
import type { AppTableRow } from "@/components/AdminDashboard/Apps/types";
import {
  Order_By,
  type App_Bool_Exp,
  type App_Order_By,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";

import {
  FetchAdminAppsQuery,
  getSdk,
} from "../graphql/server/fetch-admin-apps.generated";

const getStringPredicate = (operator: AppsSearchOperator, value: string) => {
  if (operator === "=") {
    return { _eq: value };
  }

  if (operator === "!=") {
    return { _nilike: `%${value}%` };
  }

  return { _ilike: `%${value}%` };
};

const getDatePredicate = (operator: AppsSearchOperator, value: string) => {
  const date = parseDateSearchValue(value);

  if (!date) {
    return null;
  }

  if (operator === ">") return { _gt: date };
  if (operator === ">=") return { _gte: date };
  if (operator === "<") return { _lt: date };
  if (operator === "<=") return { _lte: date };
  if (operator === "!=") return { _neq: date };
  return { _eq: date };
};

const createFieldWhere = (
  token: Extract<ParsedAppsSearchToken, { type: "field" }>,
): App_Bool_Exp | null => {
  if (token.field === "id")
    return { id: getStringPredicate(token.operator, token.value) };
  if (token.field === "name")
    return { name: getStringPredicate(token.operator, token.value) };
  if (token.field === "team")
    return { team_id: getStringPredicate(token.operator, token.value) };
  if (token.field === "created") {
    const predicate = getDatePredicate(token.operator, token.value);

    return predicate ? { created_at: predicate } : { id: { _in: [] } };
  }

  return {
    app_metadata: {
      _and: [
        { name: getStringPredicate(token.operator, token.value) },
        {
          verification_status:
            token.field === "draft"
              ? { _neq: "verified" }
              : { _eq: "verified" },
        },
      ],
    },
  };
};

export const createAppsWhere = (searchQuery: string): App_Bool_Exp => {
  if (!searchQuery) return {};

  const expressions = parseAppsSearchTokens(searchQuery)
    .map((token): App_Bool_Exp | null =>
      token.type === "plain"
        ? {
            _or: [
              { id: { _ilike: `%${token.value}%` } },
              { name: { _ilike: `%${token.value}%` } },
              { team_id: { _ilike: `%${token.value}%` } },
            ],
          }
        : createFieldWhere(token),
    )
    .filter((expression): expression is App_Bool_Exp => Boolean(expression));

  return expressions.length === 0
    ? {}
    : expressions.length === 1
      ? expressions[0]
      : { _and: expressions };
};

export const createAppsOrderBy = (sort: AppsSort | null): App_Order_By[] => {
  const effectiveSort = getEffectiveAppsSort(sort);
  const direction =
    effectiveSort.direction === "asc" ? Order_By.Asc : Order_By.Desc;

  if (effectiveSort.field === "teamId") {
    return [
      { team_id: direction },
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

  return [{ name: direction }, { id: Order_By.Asc }];
};

const mapAppToTableRow = (
  app: FetchAdminAppsQuery["app"][number],
  columnVisibility: AppColumnVisibility,
): AppTableRow => ({
  id: app.id,
  name: app.name || "Unnamed app",
  teamId: columnVisibility.teamId ? app.team_id : undefined,
  draftMetadataName: columnVisibility.draftMetadataName
    ? app.draft_metadata?.[0]?.name ?? "—"
    : undefined,
  verifiedMetadataName: columnVisibility.verifiedMetadataName
    ? app.verified_metadata?.[0]?.name ?? "—"
    : undefined,
  createdAt:
    columnVisibility.createdAt && app.created_at
      ? app.created_at.slice(0, 10)
      : undefined,
});

type FetchAdminAppsOptions = {
  columnVisibility: AppColumnVisibility;
  limit: AppsLimit;
  page: number;
  searchQuery: string;
  sort: AppsSort | null;
};

export const fetchAdminAppsPage = async (
  {
    columnVisibility,
    limit,
    page,
    searchQuery,
    sort,
  }: FetchAdminAppsOptions = {
    columnVisibility: DEFAULT_APP_COLUMN_VISIBILITY,
    limit: DEFAULT_APPS_LIMIT,
    page: DEFAULT_APPS_PAGE,
    searchQuery: "",
    sort: null,
  },
) => {
  const client = await getInternalDashboardGraphqlClient();
  const where = createAppsWhere(searchQuery);

  try {
    const data = await getSdk(client).FetchAdminApps({
      includeCreatedAt: columnVisibility.createdAt,
      includeDraftMetadata: columnVisibility.draftMetadataName,
      includeTeamId: columnVisibility.teamId,
      includeVerifiedMetadata: columnVisibility.verifiedMetadataName,
      limit,
      offset: getAppsOffset(page, limit),
      orderBy: createAppsOrderBy(sort),
      where,
    });
    const apps = data.app.map((app) => mapAppToTableRow(app, columnVisibility));
    const appsAmount = data.app_aggregate.aggregate?.count ?? apps.length;
    const totalPages = getAppsTotalPages(appsAmount, limit);

    return {
      apps,
      appsAmount,
      currentPage: clampAppsPage(page, totalPages),
      totalPages,
    };
  } catch (error) {
    logger.error("Failed to fetch admin apps", { error });
    throw error;
  }
};
