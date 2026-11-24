export type TeamsSortField = "createdAt" | "membersCount" | "name" | "status";

export type TeamsSortDirection = "asc" | "desc";

export type TeamsSort = {
  direction: TeamsSortDirection;
  field: TeamsSortField;
};

export const DEFAULT_TEAMS_SORT: TeamsSort = {
  direction: "asc",
  field: "name",
};

export const SORTABLE_TEAM_COLUMN_IDS: TeamsSortField[] = [
  "name",
  "status",
  "membersCount",
  "createdAt",
];

const TEAMS_SORT_FIELDS = new Set<TeamsSortField>(SORTABLE_TEAM_COLUMN_IDS);
const TEAMS_SORT_DIRECTIONS = new Set<TeamsSortDirection>(["asc", "desc"]);

export const parseTeamsSort = (
  sort: string | string[] | undefined,
): TeamsSort | null => {
  const rawSort = Array.isArray(sort) ? sort[0] : sort;
  const [rawField, rawDirection] = rawSort?.split(":") ?? [];

  if (
    !TEAMS_SORT_FIELDS.has(rawField as TeamsSortField) ||
    !TEAMS_SORT_DIRECTIONS.has(rawDirection as TeamsSortDirection)
  ) {
    return null;
  }

  return {
    direction: rawDirection as TeamsSortDirection,
    field: rawField as TeamsSortField,
  };
};

export const serializeTeamsSort = (sort: TeamsSort) => {
  return `${sort.field}:${sort.direction}`;
};

export const getEffectiveTeamsSort = (sort: TeamsSort | null) => {
  return sort ?? DEFAULT_TEAMS_SORT;
};

export const getNextTeamsSort = (
  currentSort: TeamsSort | null,
  field: TeamsSortField,
): TeamsSort | null => {
  if (currentSort?.field !== field) {
    return {
      direction: "desc",
      field,
    };
  }

  if (currentSort.direction === "desc") {
    return {
      direction: "asc",
      field,
    };
  }

  return null;
};
