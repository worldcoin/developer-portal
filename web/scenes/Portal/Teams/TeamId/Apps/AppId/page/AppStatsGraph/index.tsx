"use client";

import { useMemo } from "react";
import { QuickActionsSection } from "../QuickActionsSection";
import { StatsRow, TimePeriodSelector } from "./StatsRow";
import type { TimePeriod } from "./StatsRow";
import { useCachedMetrics } from "./StatsRow/use-cached-metrics";
import { useGetMetrics } from "./StatCards/use-get-metrics";
import { UnifiedChart } from "./UnifiedChart";

export type { TimePeriod } from "./StatsRow";
export { TimePeriodSelector } from "./StatsRow";

interface AppStatsGraphProps {
  appId: string;
  teamId: string;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const AppStatsGraph = ({
  appId,
  teamId,
  timePeriod,
  onTimePeriodChange,
}: AppStatsGraphProps) => {
  const { metrics, loading: metricsLoading } = useGetMetrics(appId);

  // Prepare current metrics for caching (weekly data)
  const weeklyMetrics = useMemo(() => {
    if (!metrics) return null;
    return {
      impressions: metrics.total_impressions_last_7_days ?? null,
      sessions: metrics.total_users_last_7_days ?? null,
      users: metrics.unique_users_last_7_days ?? null,
      newUsers: metrics.new_users_last_7_days ?? null,
    };
  }, [metrics]);

  // All-time metrics
  const allTimeMetrics = useMemo(() => {
    if (!metrics) return null;
    return {
      impressions: metrics.total_impressions ?? null,
      sessions: metrics.total_users ?? null,
      users: metrics.unique_users ?? null,
      newUsers: metrics.unique_users ?? null, // No separate all-time new users
    };
  }, [metrics]);

  // Get metrics with week-over-week changes from cache
  const metricsWithChange = useCachedMetrics(
    appId,
    timePeriod === "weekly" ? weeklyMetrics : allTimeMetrics,
    metricsLoading,
    timePeriod,
  );

  return (
    <div className="flex flex-col gap-y-10">
      {/* Stats Row */}
      <StatsRow {...metricsWithChange} isLoading={metricsLoading} />

      {/* Unified Chart with Tabs */}
      <UnifiedChart appId={appId} />

      {/* Quick Actions */}
      <QuickActionsSection appId={appId} teamId={teamId} />
    </div>
  );
};
