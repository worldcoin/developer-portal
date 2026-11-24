export const USER_COLUMN_OPTIONS = [
  {
    id: "name",
    label: "Name",
    isRequired: true,
  },
  {
    id: "email",
    label: "Email",
    isRequired: false,
  },
  {
    id: "teamsCount",
    label: "Teams",
    isRequired: false,
  },
  {
    id: "createdAt",
    label: "Created",
    isRequired: false,
  },
] as const;

export type UserColumnId = (typeof USER_COLUMN_OPTIONS)[number]["id"];

export type UserColumnVisibility = Record<UserColumnId, boolean>;

const REQUIRED_USER_COLUMN_IDS = USER_COLUMN_OPTIONS.filter(
  (column) => column.isRequired,
).map((column) => column.id);

const USER_COLUMN_IDS = USER_COLUMN_OPTIONS.map((column) => column.id);

export const DEFAULT_USER_COLUMN_VISIBILITY =
  USER_COLUMN_OPTIONS.reduce<UserColumnVisibility>((visibility, column) => {
    visibility[column.id] = true;
    return visibility;
  }, {} as UserColumnVisibility);

export const parseUserColumnVisibility = (
  columns: string | string[] | undefined,
): UserColumnVisibility => {
  const rawColumns = Array.isArray(columns) ? columns[0] : columns;

  if (!rawColumns) {
    return DEFAULT_USER_COLUMN_VISIBILITY;
  }

  const visibleColumnIds = new Set(
    rawColumns
      .split(",")
      .filter((columnId): columnId is UserColumnId =>
        USER_COLUMN_IDS.includes(columnId as UserColumnId),
      ),
  );

  for (const columnId of REQUIRED_USER_COLUMN_IDS) {
    visibleColumnIds.add(columnId);
  }

  return USER_COLUMN_OPTIONS.reduce<UserColumnVisibility>(
    (visibility, column) => {
      visibility[column.id] = visibleColumnIds.has(column.id);
      return visibility;
    },
    {} as UserColumnVisibility,
  );
};

export const serializeUserColumnVisibility = (
  visibility: UserColumnVisibility,
) => {
  return USER_COLUMN_OPTIONS.filter((column) => visibility[column.id])
    .map((column) => column.id)
    .join(",");
};
