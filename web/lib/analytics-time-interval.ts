export const TREND_INTERVAL_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
] as const;

export type TrendInterval = (typeof TREND_INTERVAL_OPTIONS)[number]["value"];

/** Returns an ISO day representing the start of the selected reporting period. */
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
