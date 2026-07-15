export const TEAM_COLUMN_OPTIONS = [
  {
    id: "name",
    label: "Team",
    isRequired: true,
  },
  {
    id: "status",
    label: "Status",
    isRequired: false,
  },
  {
    id: "membersCount",
    label: "Members",
    isRequired: false,
  },
  {
    id: "appsCount",
    label: "Apps",
    isRequired: false,
  },
  {
    id: "pendingInvitesCount",
    label: "Invites",
    isRequired: false,
  },
  {
    id: "activeApiKeysCount",
    label: "API keys",
    isRequired: false,
  },
  {
    id: "createdAt",
    label: "Created",
    isRequired: false,
  },
] as const;

export type TeamColumnId = (typeof TEAM_COLUMN_OPTIONS)[number]["id"];

export type TeamColumnVisibility = Record<TeamColumnId, boolean>;

const REQUIRED_TEAM_COLUMN_IDS = TEAM_COLUMN_OPTIONS.filter(
  (column) => column.isRequired,
).map((column) => column.id);

const TEAM_COLUMN_IDS = TEAM_COLUMN_OPTIONS.map((column) => column.id);

export const DEFAULT_TEAM_COLUMN_VISIBILITY =
  TEAM_COLUMN_OPTIONS.reduce<TeamColumnVisibility>((visibility, column) => {
    visibility[column.id] = true;
    return visibility;
  }, {} as TeamColumnVisibility);

export const parseTeamColumnVisibility = (
  columns: string | string[] | undefined,
): TeamColumnVisibility => {
  const rawColumns = Array.isArray(columns) ? columns[0] : columns;

  if (!rawColumns) {
    return DEFAULT_TEAM_COLUMN_VISIBILITY;
  }

  const visibleColumnIds = new Set(
    rawColumns
      .split(",")
      .filter((columnId): columnId is TeamColumnId =>
        TEAM_COLUMN_IDS.includes(columnId as TeamColumnId),
      ),
  );

  for (const columnId of REQUIRED_TEAM_COLUMN_IDS) {
    visibleColumnIds.add(columnId);
  }

  return TEAM_COLUMN_OPTIONS.reduce<TeamColumnVisibility>(
    (visibility, column) => {
      visibility[column.id] = visibleColumnIds.has(column.id);
      return visibility;
    },
    {} as TeamColumnVisibility,
  );
};

export const serializeTeamColumnVisibility = (
  visibility: TeamColumnVisibility,
) => {
  return TEAM_COLUMN_OPTIONS.filter((column) => visibility[column.id])
    .map((column) => column.id)
    .join(",");
};
