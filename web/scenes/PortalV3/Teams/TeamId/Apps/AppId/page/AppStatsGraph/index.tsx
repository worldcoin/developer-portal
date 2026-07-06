"use client";

import { useMemo } from "react";
import { useAppCapabilities } from "@/scenes/PortalV3/layout/Shell/use-app-capabilities";
import { useFetchAppStatsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/page/AppStatsGraph/graphql/client/fetch-app-stats.generated";
import { QuickActionsSection } from "../QuickActionsSection";
import { StatsRow, TimePeriodSelector } from "./StatsRow";
import type { TimePeriod, VerificationStats } from "./StatsRow";
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
  const capabilities = useAppCapabilities(appId);
  // Mini-app surfaces only appear once capabilities have loaded; the
  // integrator (verification-first) view is the default while loading,
  // matching the SidebarNav conditional-appearance rule.
  const showMiniApp = capabilities.loaded && capabilities.isMiniApp;

  // Sourced once here and threaded down to UnifiedChart/StatsRow so both the
  // verifications chart and the integrator stat cards read the same fetch
  // instead of issuing a second query.
  const { data: appStatsData, loading: appStatsLoading } =
    useFetchAppStatsQuery({ variables: { appId } });

  const verificationStats: VerificationStats = useMemo(() => {
    const stats = appStatsData?.app_stats;
    if (!stats || !stats.length) {
      return { totalVerifications: 0, uniqueHumans: 0, verifications7d: 0 };
    }

    const last = stats[stats.length - 1];
    // Series is cumulative; 7d delta = last value minus the value ~7 entries
    // earlier. Short series (<8 entries) fall back to a delta from the
    // first entry so a brand-new app still shows a sensible number.
    const priorIndex = Math.max(0, stats.length - 1 - 7);
    const prior = stats[priorIndex];

    return {
      totalVerifications: Number(last.verifications ?? 0),
      uniqueHumans: Number(last.unique_users ?? 0),
      verifications7d: Number(
        (last.verifications ?? 0) - (prior.verifications ?? 0),
      ),
    };
  }, [appStatsData?.app_stats]);

  // Miniapp metrics-endpoint fetch is only needed for the miniapp StatsRow
  // (and Notifications tab, gated separately in use-chart-data); skip it for
  // integrator apps.
  const { metrics, loading: metricsLoading } = useGetMetrics(appId, {
    skip: !showMiniApp,
  });

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
      <StatsRow
        {...metricsWithChange}
        isLoading={showMiniApp ? metricsLoading : appStatsLoading}
        showMiniApp={showMiniApp}
        verificationStats={verificationStats}
      />

      {/* Unified Chart with Tabs */}
      <UnifiedChart
        appId={appId}
        showMiniApp={showMiniApp}
        appStatsData={appStatsData}
        appStatsLoading={appStatsLoading}
      />

      {/* Quick Actions */}
      <QuickActionsSection
        appId={appId}
        teamId={teamId}
        showMiniApp={showMiniApp}
      />
    </div>
  );
};
