import { addDays, startOfDay } from "date-fns";

/** Seven trailing-day buckets aligned to the viewer's local midnight. */
export const weekBucketBounds = (now: Date): string[] => {
  const todayMidnight = startOfDay(now);

  const bounds: string[] = [];
  for (let k = 0; k <= 7; k++) {
    bounds.push(addDays(todayMidnight, k - 6).toISOString());
  }
  return bounds;
};

/** Seven equal-width buckets from creation through tomorrow's local midnight. */
export const lifetimeBucketBounds = (createdAt: Date, now: Date): string[] => {
  const end = addDays(startOfDay(now), 1).getTime();
  const requestedStart = createdAt.getTime();
  const start =
    Number.isFinite(requestedStart) && requestedStart < end
      ? requestedStart
      : startOfDay(now).getTime();
  const span = end - start;

  return Array.from({ length: 8 }, (_, index) =>
    new Date(start + Math.round((span * index) / 7)).toISOString(),
  );
};

export type TrendPeriod = "weekly" | "all-time";

const TREND_BUCKET_KEYS = ["b0", "b1", "b2", "b3", "b4", "b5", "b6"] as const;

type TrendBucket = {
  aggregate?: { count: number } | null;
} | null;

type TrendBuckets = Partial<
  Record<(typeof TREND_BUCKET_KEYS)[number], TrendBucket>
>;

export const trendPoints = (trend?: TrendBuckets | null): number[] =>
  trend
    ? TREND_BUCKET_KEYS.map((key) => trend[key]?.aggregate?.count ?? 0)
    : [];

export const trendBucketVariables = (bounds: string[]) => ({
  d0: bounds[0],
  d1: bounds[1],
  d2: bounds[2],
  d3: bounds[3],
  d4: bounds[4],
  d5: bounds[5],
  d6: bounds[6],
  d7: bounds[7],
});

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;

const bucketLabelOptions = (
  bucketDuration: number,
): Intl.DateTimeFormatOptions => {
  if (bucketDuration < DAY_MS) {
    return { month: "short", day: "numeric", hour: "numeric" };
  }
  if (bucketDuration < YEAR_MS) {
    return { month: "short", day: "numeric" };
  }
  return { month: "short", year: "numeric" };
};

export const trendBucketLabels = (
  bounds: string[],
  period: TrendPeriod,
): string[] => {
  if (period === "weekly") {
    return bounds.slice(0, 7).map((bound) => {
      const day = new Date(bound);
      return `${day.toLocaleDateString(undefined, { weekday: "short" })} · ${day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    });
  }

  return bounds.slice(0, 7).map((bound, index) => {
    const start = new Date(bound);
    const end = new Date(new Date(bounds[index + 1]).getTime() - 1);
    const bucketDuration = end.getTime() - start.getTime();
    const options = bucketLabelOptions(bucketDuration);

    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  });
};

export const trendRangeLabel = (
  period: TrendPeriod,
  createdAt?: string,
): string => {
  if (period === "weekly") {
    return "Last 7 days";
  }

  if (!createdAt) {
    return "All time";
  }

  return `All time · since ${new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};
