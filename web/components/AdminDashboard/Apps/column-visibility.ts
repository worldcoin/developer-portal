export const APP_COLUMN_OPTIONS = [
  { id: "name", label: "App", isRequired: true },
  { id: "teamId", label: "Team ID", isRequired: false },
  { id: "draftMetadataName", label: "Draft metadata", isRequired: false },
  {
    id: "verifiedMetadataName",
    label: "Verified metadata",
    isRequired: false,
  },
  { id: "createdAt", label: "Created", isRequired: false },
] as const;

export type AppColumnId = (typeof APP_COLUMN_OPTIONS)[number]["id"];
export type AppColumnVisibility = Record<AppColumnId, boolean>;

const REQUIRED_APP_COLUMN_IDS = APP_COLUMN_OPTIONS.filter(
  (column) => column.isRequired,
).map((column) => column.id);
const APP_COLUMN_IDS = APP_COLUMN_OPTIONS.map((column) => column.id);

export const DEFAULT_APP_COLUMN_VISIBILITY =
  APP_COLUMN_OPTIONS.reduce<AppColumnVisibility>((visibility, column) => {
    visibility[column.id] = true;
    return visibility;
  }, {} as AppColumnVisibility);

export const parseAppColumnVisibility = (
  columns: string | string[] | undefined,
): AppColumnVisibility => {
  const rawColumns = Array.isArray(columns) ? columns[0] : columns;

  if (!rawColumns) {
    return DEFAULT_APP_COLUMN_VISIBILITY;
  }

  const visibleColumnIds = new Set(
    rawColumns
      .split(",")
      .filter((columnId): columnId is AppColumnId =>
        APP_COLUMN_IDS.includes(columnId as AppColumnId),
      ),
  );

  for (const columnId of REQUIRED_APP_COLUMN_IDS) {
    visibleColumnIds.add(columnId);
  }

  return APP_COLUMN_OPTIONS.reduce<AppColumnVisibility>(
    (visibility, column) => {
      visibility[column.id] = visibleColumnIds.has(column.id);
      return visibility;
    },
    {} as AppColumnVisibility,
  );
};

export const serializeAppColumnVisibility = (visibility: AppColumnVisibility) =>
  APP_COLUMN_OPTIONS.filter((column) => visibility[column.id])
    .map((column) => column.id)
    .join(",");
