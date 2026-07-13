"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { trendPoints, type TrendPeriod } from "@/lib/day-buckets";
import { urls } from "@/lib/urls";
import { PeriodSelector } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/PeriodSelector";
import { TrendSparkline } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/TrendSparkline";
import {
  buildTrendState,
  useTrendWindow,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/use-trend-window";
import {
  useGetActionStatsQuery,
  useGetActionVerificationsFeedQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page/graphql/client/get-action-verifications.generated";
import { useGetWorldIdActionTrendQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/graphql/client/get-world-id-trends.generated";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SettingsCard } from "./SettingsCard";
import { VerificationsFeed } from "./VerificationsFeed";

const LIMIT = 6;
// Live-total changes refresh the aggregate queries at most this often.
const AGGREGATE_REFRESH_MS = 60_000;

const Stat = (props: { label: string; value: number }) => (
  <div className="flex flex-col gap-1.5">
    <span className="font-world text-13 text-portal-muted">{props.label}</span>
    <span className="font-twk text-[32px] font-medium leading-none tracking-[-0.01em] text-portal-heading">
      {props.value.toLocaleString()}
    </span>
  </div>
);

export const WorldIdActionDetailPage = (props: {
  params: Record<string, string>;
}) => {
  const { params } = props;
  const teamId = params.teamId;
  const appId = params.appId;
  const actionId = params.actionId;

  const [page, setPage] = useState(1);
  const [timePeriod, setTimePeriod] = useState<TrendPeriod>("weekly");
  const [deleted, setDeleted] = useState(false);
  const offset = (page - 1) * LIMIT;

  const { data, loading, error } = useGetActionVerificationsFeedQuery({
    variables: {
      action_id: actionId,
      app_id: appId,
      limit: LIMIT,
      offset,
    },
    skip: !actionId,
    // Poll only on page 1 so paging back through history isn't reset under us.
    pollInterval: page === 1 ? 5000 : 0,
    // Pause polling while the tab is hidden (`document` guard for SSR).
    skipPollAttempt: () => typeof document !== "undefined" && document.hidden,
  });

  const action = data?.action_v4?.[0];
  const total = action?.total.aggregate?.count;

  const trend = useTrendWindow({
    createdAt: action?.created_at,
    timePeriod,
  });

  // Feed total + timestamp captured at each fetch of an aggregate query; used
  // to throttle the live refreshes in the effect below.
  const statsFetchRef = useRef<{ total: number; at: number } | undefined>(
    undefined,
  );
  const trendFetchRef = useRef<{ total: number; at: number } | undefined>(
    undefined,
  );

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetActionStatsQuery({
    variables: {
      action_id: actionId,
      app_id: appId,
      ...trend.weeklyVariables,
    },
    skip: !actionId,
    onCompleted: () => {
      statsFetchRef.current = { total: total ?? 0, at: Date.now() };
    },
  });

  const {
    data: actionTrendData,
    loading: actionTrendLoading,
    error: actionTrendError,
    refetch: refetchActionTrend,
  } = useGetWorldIdActionTrendQuery({
    variables: {
      app_id: appId,
      action_id: actionId,
      ...trend.allTimeVariables,
    },
    skip: timePeriod !== "all-time" || !appId || !action,
    // Revalidate cached buckets whenever the all-time view is (re)entered.
    fetchPolicy: "cache-and-network",
    onCompleted: () => {
      trendFetchRef.current = { total: total ?? 0, at: Date.now() };
    },
  });

  // When the polled feed reports new verifications, refresh the aggregate
  // queries — throttled so a busy action doesn't refetch on every 5s tick.
  useEffect(() => {
    if (total === undefined) {
      return;
    }
    const now = Date.now();

    const statsFetch = statsFetchRef.current;
    if (
      statsFetch &&
      statsFetch.total !== total &&
      now - statsFetch.at >= AGGREGATE_REFRESH_MS
    ) {
      statsFetchRef.current = { total, at: now };
      void refetchStats();
    }

    const trendFetch = trendFetchRef.current;
    if (
      timePeriod === "all-time" &&
      trendFetch &&
      trendFetch.total !== total &&
      now - trendFetch.at >= AGGREGATE_REFRESH_MS
    ) {
      trendFetchRef.current = { total, at: now };
      void refetchActionTrend();
    }
  }, [refetchActionTrend, refetchStats, timePeriod, total]);

  if (error) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

  // After a delete the action is evicted from the cache before navigation
  // completes, so keep showing the skeletons instead of flashing a 404.
  if (!loading && !action && !deleted) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  // Total verifications === unique humans (one nullifier row per human per
  // action), rendered as two cards per the design.
  const totalCount = total ?? 0;
  const stats = statsData?.action_v4?.[0];
  const weekCount = stats?.week.aggregate?.count ?? 0;
  const sparkPoints =
    timePeriod === "all-time"
      ? trendPoints(actionTrendData?.action_v4?.[0])
      : trendPoints(stats);
  const trendState = buildTrendState({
    loading: timePeriod === "all-time" ? actionTrendLoading : statsLoading,
    error:
      timePeriod === "all-time"
        ? Boolean(actionTrendError)
        : Boolean(statsError),
    points: sparkPoints,
    labels: trend.labels,
    onRetry: () =>
      void (timePeriod === "all-time" ? refetchActionTrend() : refetchStats()),
  });

  return (
    <SizingWrapper gridClassName="pb-6 pt-6 md:pb-10">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4">
        {/* Breadcrumb — items-baseline, not items-center: the world-font link
            and the mono identifier have different vertical metrics, so center
            alignment leaves the mono text visually sagging. */}
        <div className="flex items-baseline gap-2.5">
          <Link
            href={urls.worldId({ team_id: teamId, app_id: appId })}
            className="font-world text-13 text-portal-muted transition-colors hover:text-portal-text"
          >
            Actions
          </Link>
          <span className="font-world text-13 text-portal-subtle">/</span>
          {loading || !action ? (
            <Skeleton width={120} />
          ) : (
            <span className="font-ibm text-13 font-medium text-portal-heading">
              {action.action}
            </span>
          )}
        </div>

        {/* Stats card */}
        <div className="flex flex-col gap-7 rounded-16 border border-portal-border bg-white p-8 shadow-portal-card">
          {loading || !action ? (
            <Skeleton height={128} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-ibm text-[20px] font-medium leading-none text-portal-heading">
                  {action.action}
                </span>
                {action.description ? (
                  // translate: optical correction — the mono heading's glyphs sit
                  // low in their em box, so pure box-centering leaves the
                  // description looking high against the mono ink.
                  <span className="translate-y-[3px] font-world text-sm leading-none text-portal-muted">
                    {action.description}
                  </span>
                ) : null}
                <span className="ml-auto">
                  <PeriodSelector
                    timePeriod={timePeriod}
                    onTimePeriodChange={setTimePeriod}
                  />
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-14 gap-y-6">
                <Stat label="Unique humans" value={totalCount} />
                <Stat label="This week" value={weekCount} />
                <div className="ml-auto">
                  <TrendSparkline
                    state={trendState}
                    rangeLabel={trend.rangeLabel}
                    variant="detail"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Verifications feed */}
        {loading || !action ? (
          <div className="rounded-16 border border-portal-border bg-white p-4 shadow-portal-card">
            <Skeleton height={40} count={6} />
          </div>
        ) : (
          <VerificationsFeed
            nullifiers={action.nullifiers}
            total={totalCount}
            page={page}
            rowsPerPage={LIMIT}
            onPageChange={setPage}
          />
        )}

        {/* Settings */}
        {!loading && action ? (
          <SettingsCard
            action={action}
            teamId={teamId}
            appId={appId}
            onDeleted={() => setDeleted(true)}
          />
        ) : null}
      </div>
    </SizingWrapper>
  );
};
