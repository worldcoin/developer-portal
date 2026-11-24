export const RP_COLUMN_OPTIONS = [
  { id: "rpId", label: "RP", isRequired: true },
  { id: "appId", label: "App", isRequired: true },
  { id: "mode", label: "Mode", isRequired: true },
  { id: "status", label: "Production status", isRequired: true },
  { id: "stagingStatus", label: "Staging status", isRequired: true },
  { id: "updatedAt", label: "Updated", isRequired: true },
  { id: "teamId", label: "Team ID", isRequired: false },
  { id: "signerAddress", label: "Signer", isRequired: false },
  { id: "operationHash", label: "Operation hash", isRequired: false },
  {
    id: "stagingOperationHash",
    label: "Staging operation hash",
    isRequired: false,
  },
  { id: "createdAt", label: "Created", isRequired: false },
] as const;

export type RpColumnId = (typeof RP_COLUMN_OPTIONS)[number]["id"];
export type RpColumnVisibility = Record<RpColumnId, boolean>;

const REQUIRED_RP_COLUMN_IDS = RP_COLUMN_OPTIONS.filter(
  (column) => column.isRequired,
).map((column) => column.id);
const RP_COLUMN_IDS = RP_COLUMN_OPTIONS.map((column) => column.id);

export const DEFAULT_RP_COLUMN_VISIBILITY =
  RP_COLUMN_OPTIONS.reduce<RpColumnVisibility>((visibility, column) => {
    visibility[column.id] = true;
    return visibility;
  }, {} as RpColumnVisibility);

export const parseRpColumnVisibility = (
  columns: string | string[] | undefined,
): RpColumnVisibility => {
  const rawColumns = Array.isArray(columns) ? columns[0] : columns;

  if (!rawColumns) {
    return DEFAULT_RP_COLUMN_VISIBILITY;
  }

  const visibleColumnIds = new Set(
    rawColumns
      .split(",")
      .filter((columnId): columnId is RpColumnId =>
        RP_COLUMN_IDS.includes(columnId as RpColumnId),
      ),
  );

  for (const columnId of REQUIRED_RP_COLUMN_IDS) {
    visibleColumnIds.add(columnId);
  }

  return RP_COLUMN_OPTIONS.reduce<RpColumnVisibility>((visibility, column) => {
    visibility[column.id] = visibleColumnIds.has(column.id);
    return visibility;
  }, {} as RpColumnVisibility);
};

export const serializeRpColumnVisibility = (visibility: RpColumnVisibility) =>
  RP_COLUMN_OPTIONS.filter((column) => visibility[column.id])
    .map((column) => column.id)
    .join(",");
