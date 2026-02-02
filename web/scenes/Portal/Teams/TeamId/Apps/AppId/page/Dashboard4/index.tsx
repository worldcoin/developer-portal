"use client";

import { useMemo } from "react";
import { useGetMetrics } from "../AppStatsGraph/StatCards/use-get-metrics";
import { QuickActions4 } from "./QuickActions4";
import { StatsRow } from "./StatsRow";
import { useCachedMetrics } from "./StatsRow/use-cached-metrics";
import { UnifiedChart } from "./UnifiedChart";

interface Dashboard4Props {
  appId: string;
  teamId: string;
}

export const Dashboard4 = ({ appId, teamId }: Dashboard4Props) => {
  const { metrics, loading: metricsLoading } = useGetMetrics(appId);

  // Prepare current metrics for caching
  const currentMetrics = useMemo(() => {
    if (!metrics) return null;
    return {
      impressions: metrics.total_impressions_last_7_days ?? null,
      sessions: metrics.total_users_last_7_days ?? null,
      users: metrics.unique_users_last_7_days ?? null,
      newUsers: metrics.new_users_last_7_days ?? null,
    };
  }, [metrics]);

  // Get metrics with week-over-week changes from cache
  const metricsWithChange = useCachedMetrics(
    appId,
    currentMetrics,
    metricsLoading
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
