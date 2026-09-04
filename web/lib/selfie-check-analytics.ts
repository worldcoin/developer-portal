export type TotalsRow = Readonly<{
  appId: string;
  n_users_started_at_least_one_selfie_check_flow: number | null;
  n_users_shared_at_least_one_proof: number | null;
  n_selfie_check_started_sessions: number | null;
  n_face_capture_started_sessions: number | null;
  n_face_capture_completed_sessions: number | null;
  n_proof_shared_sessions: number | null;
  p_selfie_check_to_face_capture_started_completion: number | null;
  p_face_capture_started_to_completed_completion: number | null;
  p_face_capture_completed_to_proof_shared_completion: number | null;
}>;

export type DailyRow = Readonly<{
  appId: string;
  day: string;
  os_name: string;
  n_users_started_selfie_check_flow: number | null;
  n_users_shared_a_proof: number | null;
  cumulative_n_users_shared_a_proof: number | null;
  p_face_capture_completion: number | null;
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
    key: "n_users_started_at_least_one_selfie_check_flow",
    kind: "count",
    label: "Users started at least one selfie check flow",
    visible: true,
  },
  {
    key: "n_users_shared_at_least_one_proof",
    kind: "count",
    label: "Users shared at least one proof",
    visible: true,
  },
  {
    key: "n_selfie_check_started_sessions",
    kind: "count",
    label: "Selfie check started sessions",
    visible: true,
  },
  {
    key: "n_face_capture_started_sessions",
    kind: "count",
    label: "Face capture started sessions",
    visible: true,
  },
  {
    key: "n_face_capture_completed_sessions",
    kind: "count",
    label: "Face capture completed sessions",
    visible: true,
  },
  {
    key: "n_proof_shared_sessions",
    kind: "count",
    label: "Proof shared sessions",
    visible: true,
  },
  {
    key: "p_selfie_check_to_face_capture_started_completion",
    kind: "rate",
    label: "Selfie check to face capture started completion",
    visible: true,
  },
  {
    key: "p_face_capture_started_to_completed_completion",
    kind: "rate",
    label: "Face capture started to completed completion",
    visible: true,
  },
  {
    key: "p_face_capture_completed_to_proof_shared_completion",
    kind: "rate",
    label: "Face capture completed to proof shared completion",
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
  {
    key: "n_users_shared_a_proof",
    kind: "count",
    label: "Users shared a proof",
    visible: true,
  },
  {
    key: "cumulative_n_users_shared_a_proof",
    kind: "count",
    label: "Cumulative users shared a proof",
    visible: true,
  },
  {
    key: "p_face_capture_completion",
    kind: "rate",
    label: "Face capture completion",
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

const LEGACY_TOTAL_METRIC_KEYS: Partial<
  Record<keyof TableColumnsTotal, string>
> = {
  n_users_started_at_least_one_selfie_check_flow:
    "n_users_started_selfie_check_flow",
  n_users_shared_at_least_one_proof: "n_proof_users",
  n_face_capture_started_sessions: "n_face_auth_started_sessions",
  n_face_capture_completed_sessions: "n_face_auth_completed_sessions",
  n_proof_shared_sessions: "n_proofs",
  p_face_capture_started_to_completed_completion: "p_face_auth_completion",
};
const LEGACY_TOTAL_METRIC_NAMES = Object.values(LEGACY_TOTAL_METRIC_KEYS);
const LEGACY_OPTIONAL_TOTAL_KEYS = new Set<keyof TableColumnsTotal>([
  "n_selfie_check_started_sessions",
  "p_selfie_check_to_face_capture_started_completion",
  "p_face_capture_completed_to_proof_shared_completion",
]);

const LEGACY_DAILY_METRIC_KEYS: Partial<
  Record<keyof TableColumnsDaily, string>
> = {
  n_users_shared_a_proof: "n_proof_users",
  cumulative_n_users_shared_a_proof: "cumulative_n_proof_users",
  p_face_capture_completion: "p_face_auth_completion",
};

/** Validates and copies the required fields of a public, flat totals row. */
export const pickTotalsRow = (value: unknown): TotalsRow | null => {
  if (!isRecord(value) || typeof value.appId !== "string") return null;
  const row = { appId: value.appId } as Record<keyof TotalsRow, unknown>;
  const isLegacyRow = LEGACY_TOTAL_METRIC_NAMES.some(
    (legacyKey) =>
      legacyKey !== undefined &&
      Object.prototype.hasOwnProperty.call(value, legacyKey),
  );

  for (const column of TABLE_COLUMNS_TOTAL) {
    const legacyKey = LEGACY_TOTAL_METRIC_KEYS[column.key];
    const metric = Object.prototype.hasOwnProperty.call(value, column.key)
      ? value[column.key]
      : legacyKey && Object.prototype.hasOwnProperty.call(value, legacyKey)
        ? value[legacyKey]
        : isLegacyRow && LEGACY_OPTIONAL_TOTAL_KEYS.has(column.key)
          ? null
          : undefined;
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

  // Accept rows cached by an older deployment while the renamed warehouse
  // columns roll out. Returned rows always use the new public field names.
  for (const column of TABLE_COLUMNS_DAILY) {
    if (column.kind === "date" || column.kind === "category") continue;

    const legacyKey = LEGACY_DAILY_METRIC_KEYS[column.key];
    const metric = Object.prototype.hasOwnProperty.call(value, column.key)
      ? value[column.key]
      : legacyKey
        ? value[legacyKey]
        : undefined;
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

export type DailyTimeframeDays = 7 | 14 | 30 | null;

/** Applies the daily chart controls relative to the newest available data day. */
export const filterDailyRows = (
  rows: readonly DailyRow[],
  filters: Readonly<{
    days: DailyTimeframeDays;
    osName: string | null;
  }>,
): readonly DailyRow[] => {
  const latestDay = rows.reduce<string | null>(
    (latest, row) => (latest === null || row.day > latest ? row.day : latest),
    null,
  );

  let cutoffDay: string | null = null;
  if (filters.days !== null && latestDay !== null) {
    const cutoff = new Date(`${latestDay}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - (filters.days - 1));
    cutoffDay = cutoff.toISOString().slice(0, 10);
  }

  return rows.filter(
    (row) =>
      (cutoffDay === null || row.day >= cutoffDay) &&
      (filters.osName === null || row.os_name === filters.osName),
  );
};

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
