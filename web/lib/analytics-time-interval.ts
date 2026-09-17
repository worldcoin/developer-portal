/** Warehouse period tables; each value is also the `?table=` the API accepts. */
export const PERIOD_TABLES = ["daily", "weekly", "monthly"] as const;

export type PeriodTable = (typeof PERIOD_TABLES)[number];

export const isPeriodTable = (value: unknown): value is PeriodTable =>
  typeof value === "string" &&
  (PERIOD_TABLES as readonly string[]).includes(value);

/** Reporting granularity shown in the trend charts; reads the matching table. */
export type TrendInterval = PeriodTable;

export const TREND_INTERVAL_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
] as const satisfies readonly { label: string; value: TrendInterval }[];

export type RangeOption = Readonly<{
  label: string;
  value: string;
  /** Number of newest periods to keep; `null` keeps every period. */
  periods: number | null;
}>;

/**
 * Date-range presets per interval, in that interval's own unit, so the two
 * controls can never combine into an empty or misleading window.
 */
export const RANGE_OPTIONS: Record<TrendInterval, readonly RangeOption[]> = {
  daily: [
    { label: "Past 7 days", value: "7", periods: 7 },
    { label: "Past 14 days", value: "14", periods: 14 },
    { label: "Past 30 days", value: "30", periods: 30 },
    { label: "All time", value: "all", periods: null },
  ],
  weekly: [
    { label: "Past 4 weeks", value: "4", periods: 4 },
    { label: "Past 8 weeks", value: "8", periods: 8 },
    { label: "Past 12 weeks", value: "12", periods: 12 },
    { label: "All time", value: "all", periods: null },
  ],
  monthly: [
    { label: "Past 3 months", value: "3", periods: 3 },
    { label: "Past 6 months", value: "6", periods: 6 },
    { label: "Past 12 months", value: "12", periods: 12 },
    { label: "All time", value: "all", periods: null },
  ],
};

export const DEFAULT_RANGE: Record<TrendInterval, string> = {
  daily: "14",
  weekly: "8",
  monthly: "6",
};

/** Singular period noun for chart titles and loading copy. */
export const PERIOD_NOUN: Record<TrendInterval, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

/** Resolves a range value for an interval, falling back to that interval's default. */
export const rangePeriods = (
  interval: TrendInterval,
  value: string,
): number | null =>
  (
    RANGE_OPTIONS[interval].find((option) => option.value === value) ??
    RANGE_OPTIONS[interval].find(
      (option) => option.value === DEFAULT_RANGE[interval],
    )
  )?.periods ?? null;

/**
 * Keeps rows whose period start falls within the newest `periods` reporting
 * periods, using the newest period start in `rows` as the inclusive upper
 * bound. `null` keeps everything. Rows carry the period start in `day`.
 */
export const filterRowsToLatestPeriods = <T extends { day: string }>(
  rows: readonly T[],
  interval: TrendInterval,
  periods: number | null,
): readonly T[] => {
  if (periods === null) return rows;
  const latestDay = rows.reduce<string | null>(
    (latest, row) => (latest === null || row.day > latest ? row.day : latest),
    null,
  );
  if (latestDay === null) return rows;

  const cutoff = new Date(`${latestDay}T00:00:00.000Z`);
  if (interval === "monthly") {
    cutoff.setUTCMonth(cutoff.getUTCMonth() - (periods - 1));
  } else {
    cutoff.setUTCDate(
      cutoff.getUTCDate() - (periods - 1) * (interval === "weekly" ? 7 : 1),
    );
  }
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  return rows.filter((row) => row.day >= cutoffDay);
};

/**
 * Returns an ISO day representing the start of the selected reporting period.
 * Only the local Proofs preview still buckets client-side; the Selfie Check
 * charts read pre-aggregated weekly and monthly tables. Delete with that mock.
 */
export const getTrendIntervalStart = (
  day: string,
  interval: TrendInterval,
): string => {
  if (interval === "daily") return day;

  const date = new Date(`${day}T00:00:00.000Z`);
  if (interval === "monthly") {
    date.setUTCDate(1);
  } else {
    // Weeks begin on Monday, which keeps the bucket stable across locales.
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  }
  return date.toISOString().slice(0, 10);
};
