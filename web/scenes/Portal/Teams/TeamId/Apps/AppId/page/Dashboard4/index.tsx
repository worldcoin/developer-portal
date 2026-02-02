"use client";

import { useMemo, useState } from "react";
import { useGetMetrics } from "../AppStatsGraph/StatCards/use-get-metrics";
import { QuickActions4 } from "./QuickActions4";
import { StatsRow, TimePeriod, TimePeriodSelector } from "./StatsRow";
import { useCachedMetrics } from "./StatsRow/use-cached-metrics";
import { UnifiedChart } from "./UnifiedChart";

export { TimePeriod, TimePeriodSelector } from "./StatsRow";

interface Dashboard4Props {
  appId: string;
  teamId: string;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const Dashboard4 = ({
  appId,
  teamId,
  timePeriod,
  onTimePeriodChange,
}: Dashboard4Props) => {
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
    timePeriod
  );

  return (
    <div className="flex flex-col gap-y-10">
      {/* Stats Row */}
      <StatsRow {...metricsWithChange} isLoading={metricsLoading} />

      {/* Unified Chart with Tabs */}
      <UnifiedChart appId={appId} />

      {/* Quick Actions */}
      <QuickActions4 appId={appId} teamId={teamId} />
    </div>
  );
};
