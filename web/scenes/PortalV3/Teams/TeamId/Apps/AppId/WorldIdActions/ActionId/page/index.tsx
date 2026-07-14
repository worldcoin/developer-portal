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
import { NetworkStatus } from "@apollo/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SettingsCard } from "./SettingsCard";
import { VerificationsFeed } from "./VerificationsFeed";

const LIMIT = 6;
const AGGREGATE_REFRESH_MS = 60_000;

const Stat = (props: { label: string; value?: number }) => (
  <div className="flex flex-col gap-1.5">
    <span className="font-world text-13 text-portal-muted">{props.label}</span>
    <span className="font-twk text-[32px] leading-none font-medium tracking-[-0.01em] text-portal-heading">
      {props.value === undefined ? "—" : props.value.toLocaleString()}
    </span>
  </div>
);

export const WorldIdActionDetailPage = (props: {
  params: Record<string, string>;
  canDelete: boolean;
}) => {
  const { params, canDelete } = props;
  const teamId = params.teamId;
  const appId = params.appId;
  const actionId = params.actionId;

  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState<number>();
  const [timePeriod, setTimePeriod] = useState<TrendPeriod>("weekly");
  const [deleted, setDeleted] = useState(false);
  const offset = (page - 1) * LIMIT;

  const { data, previousData, loading, error, networkStatus } =
    useGetActionVerificationsFeedQuery({
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
      onCompleted: () => setLoadedPage(page),
    });

  const queriedAction = data?.action_v4?.[0];
  const previousAction = previousData?.action_v4?.[0];
  const currentAction =
    queriedAction?.id === actionId ? queriedAction : undefined;
  const action =
    currentAction ??
    (previousAction?.id === actionId ? previousAction : undefined);
  const total = action?.total.aggregate?.count;

  const trend = useTrendWindow({
    createdAt: action?.created_at,
    timePeriod,
  });

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
    fetchPolicy: "cache-and-network",
    onCompleted: () => {
      trendFetchRef.current = { total: total ?? 0, at: Date.now() };
    },
  });

  useEffect(() => {
    if (total === undefined) {
      return;
    }
    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleTrailingRefresh = (
      fetchRef: typeof statsFetchRef,
      refetch: () => Promise<unknown>,
    ) => {
      const fetched = fetchRef.current;
      if (!fetched || fetched.total === total) {
        return;
      }

      const refresh = () => {
        if (fetchRef.current?.total === total) {
          return;
        }
        // Keep the last successful total so failed refetches remain retryable.
        fetchRef.current = { total: fetched.total, at: Date.now() };
        void refetch();
      };
      const delay = AGGREGATE_REFRESH_MS - (now - fetched.at);
      if (delay <= 0) {
        refresh();
      } else {
        timers.push(setTimeout(refresh, delay));
      }
    };

    // Avoid duplicate refreshes while an aggregate query is in flight.
    if (!statsLoading) {
      scheduleTrailingRefresh(statsFetchRef, refetchStats);
    }
    if (timePeriod === "all-time" && !actionTrendLoading) {
      scheduleTrailingRefresh(trendFetchRef, refetchActionTrend);
    }

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [
    actionTrendLoading,
    refetchActionTrend,
    refetchStats,
    statsLoading,
    timePeriod,
    total,
  ]);

  if (error && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

  // Avoid flashing a 404 while deletion navigation completes.
  if (!loading && !action && !deleted) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  const uniqueVerificationCount = total ?? 0;
  const stats = statsData?.action_v4?.[0];
  const weekCount = stats?.week.aggregate?.count;
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
    // Apollo exposes refetch failures through query error state.
    onRetry: () =>
      void (
        timePeriod === "all-time" ? refetchActionTrend() : refetchStats()
      ).catch(() => {}),
  });

  return (
    <SizingWrapper gridClassName="pb-6 pt-6 md:pb-10">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4">
        <div className="flex items-baseline gap-2.5">
          <Link
            href={urls.worldId({ team_id: teamId, app_id: appId })}
            className="font-world text-13 text-portal-muted transition-colors hover:text-portal-text"
          >
            Actions
          </Link>
          <span className="font-world text-13 text-portal-subtle">/</span>
          {!action ? (
            <Skeleton width={120} />
          ) : (
            <span className="font-ibm text-13 font-medium text-portal-heading">
              {action.action}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-7 rounded-16 border border-portal-border bg-white p-8 shadow-portal-card">
          {!action ? (
            <Skeleton height={128} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-ibm text-[20px] leading-none font-medium text-portal-heading">
                  {action.action}
                </span>
                {action.description ? (
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
                <Stat
                  label="Unique verifications"
                  value={uniqueVerificationCount}
                />
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

        {networkStatus === NetworkStatus.setVariables ||
        loadedPage !== page ||
        !currentAction ? (
          <div className="rounded-16 border border-portal-border bg-white p-4 shadow-portal-card">
            <Skeleton height={40} count={6} />
          </div>
        ) : (
          <VerificationsFeed
            nullifiers={currentAction.nullifiers}
            total={currentAction.total.aggregate?.count ?? 0}
            page={page}
            rowsPerPage={LIMIT}
            onPageChange={setPage}
          />
        )}

        {action ? (
          <SettingsCard
            action={action}
            teamId={teamId}
            appId={appId}
            canDelete={canDelete}
            onDeleted={() => setDeleted(true)}
          />
        ) : null}
      </div>
    </SizingWrapper>
  );
};
