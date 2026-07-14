"use client";

import {
  lifetimeBucketBounds,
  trendBucketLabels,
  trendBucketVariables,
  trendRangeLabel,
  type TrendPeriod,
  weekBucketBounds,
} from "@/lib/day-buckets";
import { useMemo, useState } from "react";
import type { TrendSparklineState } from "./TrendSparkline";

export type TrendWindow = {
  weeklyBounds: string[];
  allTimeBounds: string[];
  selectedBounds: string[];
  labels: string[];
  rangeLabel: string;
  weeklyVariables: Record<string, string>;
  allTimeVariables: Record<string, string>;
};

type TrendBucketVariables = ReturnType<typeof trendBucketVariables>;

/** Freezes time bounds at mount to keep Apollo cache keys stable. */
export const useTrendWindow = (opts: {
  createdAt?: string | null;
  timePeriod: TrendPeriod;
}): TrendWindow & {
  weeklyVariables: TrendBucketVariables;
  allTimeVariables: TrendBucketVariables;
} => {
  const { createdAt, timePeriod } = opts;

  const [now] = useState(() => new Date());
  const weeklyBounds = useMemo(() => weekBucketBounds(now), [now]);
  const allTimeBounds = useMemo(
    () =>
      lifetimeBucketBounds(createdAt ? new Date(createdAt) : new Date(0), now),
    [createdAt, now],
  );
  const selectedBounds =
    timePeriod === "all-time" ? allTimeBounds : weeklyBounds;
  const labels = useMemo(
    () => trendBucketLabels(selectedBounds, timePeriod),
    [selectedBounds, timePeriod],
  );
  const rangeLabel = useMemo(
    () => trendRangeLabel(timePeriod, createdAt ?? undefined),
    [createdAt, timePeriod],
  );
  const weeklyVariables = useMemo(
    () => trendBucketVariables(weeklyBounds),
    [weeklyBounds],
  );
  const allTimeVariables = useMemo(
    () => trendBucketVariables(allTimeBounds),
    [allTimeBounds],
  );

  return {
    weeklyBounds,
    allTimeBounds,
    selectedBounds,
    labels,
    rangeLabel,
    weeklyVariables,
    allTimeVariables,
  };
};

export const buildTrendState = (opts: {
  loading: boolean;
  error: boolean;
  points: number[];
  labels: string[];
  onRetry: () => void;
}): TrendSparklineState => {
  if (opts.loading) {
    return { status: "loading" };
  }
  if (opts.error) {
    return { status: "error", onRetry: opts.onRetry };
  }
  return { status: "ready", points: opts.points, labels: opts.labels };
};
