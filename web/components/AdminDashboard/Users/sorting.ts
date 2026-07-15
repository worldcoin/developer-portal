export type UsersSortField = "createdAt" | "email" | "name" | "teamsCount";

export type UsersSortDirection = "asc" | "desc";

export type UsersSort = {
  direction: UsersSortDirection;
  field: UsersSortField;
};

export const DEFAULT_USERS_SORT: UsersSort = {
  direction: "asc",
  field: "name",
};

export const SORTABLE_USER_COLUMN_IDS: UsersSortField[] = [
  "name",
  "email",
  "teamsCount",
  "createdAt",
];

const USERS_SORT_FIELDS = new Set<UsersSortField>(SORTABLE_USER_COLUMN_IDS);
const USERS_SORT_DIRECTIONS = new Set<UsersSortDirection>(["asc", "desc"]);

export const parseUsersSort = (
  sort: string | string[] | undefined,
): UsersSort | null => {
  const rawSort = Array.isArray(sort) ? sort[0] : sort;
  const [rawField, rawDirection] = rawSort?.split(":") ?? [];

  if (
    !USERS_SORT_FIELDS.has(rawField as UsersSortField) ||
    !USERS_SORT_DIRECTIONS.has(rawDirection as UsersSortDirection)
  ) {
    return null;
  }

  return {
    direction: rawDirection as UsersSortDirection,
    field: rawField as UsersSortField,
  };
};

export const serializeUsersSort = (sort: UsersSort) => {
  return `${sort.field}:${sort.direction}`;
};

export const getEffectiveUsersSort = (sort: UsersSort | null) => {
  return sort ?? DEFAULT_USERS_SORT;
};

export const getNextUsersSort = (
  currentSort: UsersSort | null,
  field: UsersSortField,
): UsersSort | null => {
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
