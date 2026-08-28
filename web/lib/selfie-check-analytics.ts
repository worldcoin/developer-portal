export type TotalsRow = Readonly<{
  appId: string;
  n_users_started_selfie_check_flow: number | null;
  n_proofs: number | null;
  n_proof_users: number | null;
  n_face_auth_started_sessions: number | null;
  n_face_auth_completed_sessions: number | null;
  p_face_auth_completion: number | null;
}>;

export type DailyRow = Readonly<{
  appId: string;
  day: string;
  os_name: string;
  n_users_started_selfie_check_flow: number | null;
  n_proofs: number | null;
  n_proof_users: number | null;
  cumulative_n_proofs: number | null;
  cumulative_n_proof_users: number | null;
  n_face_auth_started_sessions: number | null;
  n_face_auth_completed_sessions: number | null;
  p_face_auth_completion: number | null;
}>;

export type TableColumnsTotal = Omit<TotalsRow, "appId">;
export type TableColumnsDaily = Omit<DailyRow, "appId">;

export type MetricKind = "count" | "rate";
export type DailyColumnKind = MetricKind | "date" | "category";

export type TableColumnTotalSpec = Readonly<{
  key: keyof TableColumnsTotal;
  kind: MetricKind;
  label: string;
  visible: boolean;
}>;

export type TableColumnDailySpec = Readonly<{
  key: keyof TableColumnsDaily;
  kind: DailyColumnKind;
  label: string;
  visible: boolean;
}>;

/**
 * Frozen totals-table contract. The API adapter copies only these keys;
 * the grid masks cards with `visible`.
 */
export const TABLE_COLUMNS_TOTAL = [
  {
    key: "n_users_started_selfie_check_flow",
    kind: "count",
    label: "Users started selfie check",
    visible: true,
  },
  { key: "n_proofs", kind: "count", label: "Proofs", visible: true },
  { key: "n_proof_users", kind: "count", label: "Proof users", visible: true },
  {
    key: "n_face_auth_started_sessions",
    kind: "count",
    label: "Face auth started sessions",
    visible: true,
  },
  {
    key: "n_face_auth_completed_sessions",
    kind: "count",
    label: "Face auth completed sessions",
    visible: true,
  },
  {
    key: "p_face_auth_completion",
    kind: "rate",
    label: "Face auth completion",
    visible: true,
  },
] as const satisfies readonly TableColumnTotalSpec[];

/** Ordered display contract for the app-scoped daily analytics table. */
export const TABLE_COLUMNS_DAILY = [
  { key: "day", kind: "date", label: "Day", visible: true },
  { key: "os_name", kind: "category", label: "OS", visible: true },
  {
    key: "n_users_started_selfie_check_flow",
    kind: "count",
    label: "Users started selfie check",
    visible: true,
  },
  { key: "n_proofs", kind: "count", label: "Proofs", visible: true },
  {
    key: "n_proof_users",
    kind: "count",
    label: "Proof users",
    visible: true,
  },
  {
    key: "cumulative_n_proofs",
    kind: "count",
    label: "Cumulative proofs",
    visible: true,
  },
  {
    key: "cumulative_n_proof_users",
    kind: "count",
    label: "Cumulative proof users",
    visible: true,
  },
  {
    key: "n_face_auth_started_sessions",
    kind: "count",
    label: "Face auth started sessions",
    visible: true,
  },
  {
    key: "n_face_auth_completed_sessions",
    kind: "count",
    label: "Face auth completed sessions",
    visible: true,
  },
  {
    key: "p_face_auth_completion",
    kind: "rate",
    label: "Face auth completion",
    visible: true,
  },
] as const satisfies readonly TableColumnDailySpec[];

const isNullableMetric = (
  value: unknown,
  kind: MetricKind,
): value is number | null => {
  if (value === null) return true;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return false;
  }
  if (kind === "count") return Number.isSafeInteger(value);
  return value <= 1;
};

/** Validates and copies the required fields of a public, flat totals row. */
export const pickTotalsRow = (value: unknown): TotalsRow | null => {
  if (!isRecord(value) || typeof value.appId !== "string") return null;
  const row = { appId: value.appId } as Record<keyof TotalsRow, unknown>;

  for (const column of TABLE_COLUMNS_TOTAL) {
    const metric = value[column.key];
    if (!isNullableMetric(metric, column.kind)) return null;
    row[column.key] = metric;
  }

  return row as TotalsRow;
};

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isIsoDay = (value: unknown): value is string => {
  if (typeof value !== "string" || !ISO_DAY_PATTERN.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

/** Validates and copies the required fields of a public daily row. */
export const pickDailyRow = (value: unknown): DailyRow | null => {
  if (
    !isRecord(value) ||
    typeof value.appId !== "string" ||
    !isIsoDay(value.day) ||
    typeof value.os_name !== "string" ||
    value.os_name.length === 0
  ) {
    return null;
  }

  const row = {
    appId: value.appId,
    day: value.day,
    os_name: value.os_name,
  } as Record<keyof DailyRow, unknown>;

  for (const column of TABLE_COLUMNS_DAILY) {
    if (column.kind === "date" || column.kind === "category") continue;

    const metric = value[column.key];
    if (!isNullableMetric(metric, column.kind)) return null;
    row[column.key] = metric;
  }

  return row as DailyRow;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// ============================================================================
// Chart Data
// ============================================================================

/** Daily columns that can be plotted (every column except the row keys). */
export type DailyChartMetric = Exclude<
  keyof TableColumnsDaily,
  "day" | "os_name"
>;

/** One recharts data point: the ISO day plus one value key per OS series. */
export type DailyChartPoint = {
  [series: string]: number | null | string;
} & { date: string };

export type DailyChartOs = Readonly<{
  /** Collision-free point key ("os:" + name); never equals the x-axis key. */
  dataKey: string;
  /** The OS name exactly as it appears in the data. */
  osName: string;
}>;

export type DailyChartData = Readonly<{
  /** One point per day, ascending. A day missing an OS omits its key. */
  points: readonly DailyChartPoint[];
  /** One entry per OS, alphabetical for stable colors across metrics. */
  operatingSystems: readonly DailyChartOs[];
}>;

/**
 * Pivots per-app daily rows (one per day+OS) into the flat one-object-per-day
 * shape recharts consumes. Series values are keyed by a prefixed identifier
 * rather than the display label, so no OS name can collide with the x-axis
 * key or with another series.
 */
export const buildDailyChartData = (
  rows: readonly DailyRow[],
  metric: DailyChartMetric,
): DailyChartData => {
  const pointsByDay = new Map<string, DailyChartPoint>();
  const osNames = new Set<string>();

  for (const row of rows) {
    osNames.add(row.os_name);
    const point = pointsByDay.get(row.day) ?? { date: row.day };
    point[`os:${row.os_name}`] = row[metric];
    pointsByDay.set(row.day, point);
  }

  return {
    points: [...pointsByDay.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    operatingSystems: [...osNames]
      .sort()
      .map((osName) => ({ dataKey: `os:${osName}`, osName })),
  };
};
