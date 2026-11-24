export type RpsSortField =
  | "appId"
  | "createdAt"
  | "mode"
  | "rpId"
  | "status"
  | "updatedAt";
export type RpsSortDirection = "asc" | "desc";
export type RpsSort = { direction: RpsSortDirection; field: RpsSortField };

export const DEFAULT_RPS_SORT: RpsSort = {
  direction: "desc",
  field: "updatedAt",
};

export const SORTABLE_RP_COLUMN_IDS: RpsSortField[] = [
  "rpId",
  "appId",
  "mode",
  "status",
  "createdAt",
  "updatedAt",
];

const RPS_SORT_FIELDS = new Set<RpsSortField>(SORTABLE_RP_COLUMN_IDS);
const RPS_SORT_DIRECTIONS = new Set<RpsSortDirection>(["asc", "desc"]);

export const parseRpsSort = (
  sort: string | string[] | undefined,
): RpsSort | null => {
  const rawSort = Array.isArray(sort) ? sort[0] : sort;
  const [rawField, rawDirection] = rawSort?.split(":") ?? [];

  if (
    !RPS_SORT_FIELDS.has(rawField as RpsSortField) ||
    !RPS_SORT_DIRECTIONS.has(rawDirection as RpsSortDirection)
  ) {
    return null;
  }

  return {
    direction: rawDirection as RpsSortDirection,
    field: rawField as RpsSortField,
  };
};

export const serializeRpsSort = (sort: RpsSort) =>
  `${sort.field}:${sort.direction}`;

export const getEffectiveRpsSort = (sort: RpsSort | null) =>
  sort ?? DEFAULT_RPS_SORT;

export const getNextRpsSort = (
  currentSort: RpsSort | null,
  field: RpsSortField,
): RpsSort | null => {
  const effectiveSort = getEffectiveRpsSort(currentSort);

  if (effectiveSort.field !== field) {
    return { direction: "desc", field };
  }

  return effectiveSort.direction === "desc"
    ? { direction: "asc", field }
    : null;
};
