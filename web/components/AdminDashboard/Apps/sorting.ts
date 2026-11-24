export type AppsSortField = "createdAt" | "name" | "teamId";
export type AppsSortDirection = "asc" | "desc";
export type AppsSort = { direction: AppsSortDirection; field: AppsSortField };

export const DEFAULT_APPS_SORT: AppsSort = { direction: "asc", field: "name" };

export const SORTABLE_APP_COLUMN_IDS: AppsSortField[] = [
  "name",
  "teamId",
  "createdAt",
];

const APPS_SORT_FIELDS = new Set<AppsSortField>(SORTABLE_APP_COLUMN_IDS);
const APPS_SORT_DIRECTIONS = new Set<AppsSortDirection>(["asc", "desc"]);

export const parseAppsSort = (
  sort: string | string[] | undefined,
): AppsSort | null => {
  const rawSort = Array.isArray(sort) ? sort[0] : sort;
  const [rawField, rawDirection] = rawSort?.split(":") ?? [];

  if (
    !APPS_SORT_FIELDS.has(rawField as AppsSortField) ||
    !APPS_SORT_DIRECTIONS.has(rawDirection as AppsSortDirection)
  ) {
    return null;
  }

  return {
    direction: rawDirection as AppsSortDirection,
    field: rawField as AppsSortField,
  };
};

export const serializeAppsSort = (sort: AppsSort) =>
  `${sort.field}:${sort.direction}`;

export const getEffectiveAppsSort = (sort: AppsSort | null) =>
  sort ?? DEFAULT_APPS_SORT;

export const getNextAppsSort = (
  currentSort: AppsSort | null,
  field: AppsSortField,
): AppsSort | null => {
  if (currentSort?.field !== field) {
    return { direction: "desc", field };
  }

  return currentSort.direction === "desc" ? { direction: "asc", field } : null;
};
