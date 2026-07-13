"use client";

import { Button } from "@/components/Button";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { trendPoints, type TrendPeriod } from "@/lib/day-buckets";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import {
  buildTrendState,
  useTrendWindow,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/use-trend-window";
import { BanMessageDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/common/BanMessageDialog";
import { banMessageDialogOpenedAtom } from "@/scenes/common/Teams/TeamId/Apps/common/BanMessageDialog/atoms";
import { useGetWorldIdAppTrendQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/graphql/client/get-world-id-trends.generated";
import { useGetWorldIdOverviewQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ActionsGrid } from "./ActionsGrid";
import { HeroCard } from "./HeroCard";
import { RegisterRpEmptyState } from "./RegisterRpEmptyState";
import { WorldId40Pane, type RpStatus } from "./WorldId40Pane";
import { WorldIdTab, WorldIdTabs } from "./WorldIdTabs";

// Compact ban notice mirroring the old dashboard's BanStatusSection; opens the
// shared BanMessageDialog (mounted alongside) via its jotai atom.
const BanBanner = () => {
  const [, setIsOpened] = useAtom(banMessageDialogOpenedAtom);

  return (
    <>
      <div className="flex items-center gap-3 rounded-[10px] border border-system-error-200 bg-system-error-50 px-5 py-3 text-system-error-600">
        <AlertIcon className="shrink-0 text-system-error-600" />
        <span className="min-w-0 flex-1 font-world text-13 leading-[1.3]">
          Your app was banned, users cannot access it anymore
        </span>

        <Button
          type="button"
          onClick={() => setIsOpened(true)}
          className="shrink-0 font-world text-13 font-medium text-system-error-600 transition-colors hover:text-system-error-700"
        >
          More Information
        </Button>
      </div>

      <BanMessageDialog />
    </>
  );
};

export const WorldIdPage = (props: {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}) => {
  const teamId = props.params.teamId ?? "";
  const appId = props.params.appId ?? "";
  const { user } = useUser() as Auth0SessionUser;

  const [tab, setTab] = useState<WorldIdTab>(
    props.searchParams.tab === "world-id-4-0" ? "world-id-4-0" : "actions",
  );
  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState<TrendPeriod>("weekly");

  // The overview query both consumes the weekly bucket variables and is the
  // source of the RP's created_at (which drives the all-time window), so
  // created_at is mirrored through state to break the cycle. The trend hook
  // falls back to the weekly window until it's set.
  const [rpCreatedAt, setRpCreatedAt] = useState<string>();
  const trend = useTrendWindow({ createdAt: rpCreatedAt, timePeriod });

  const { data, loading, error, refetch } = useGetWorldIdOverviewQuery({
    variables: {
      app_id: appId,
      ...trend.weeklyVariables,
    },
    skip: !appId,
  });

  const fetchedRpCreatedAt = data?.app?.[0]?.rp_registration?.[0]?.created_at;
  useEffect(() => {
    if (fetchedRpCreatedAt) setRpCreatedAt(fetchedRpCreatedAt as string);
  }, [fetchedRpCreatedAt]);

  const {
    data: appTrendData,
    loading: appTrendLoading,
    error: appTrendError,
    refetch: refetchAppTrend,
  } = useGetWorldIdAppTrendQuery({
    variables: {
      app_id: appId,
      ...trend.allTimeVariables,
    },
    skip: timePeriod !== "all-time" || !appId || !rpCreatedAt,
  });

  if (loading) {
    return (
      <SizingWrapper className="flex flex-col gap-8 py-8">
        <Skeleton height={150} className="rounded-[10px]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton height={220} count={3} className="rounded-[10px]" />
        </div>
      </SizingWrapper>
    );
  }

  // Only hard-fail without cached data: a failed refetch (e.g. after closing
  // the enable dialog) sets `error` while `data` is still valid.
  if (error && !data) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={500} title="Failed to load World ID" />
      </SizingWrapper>
    );
  }

  const app = data?.app?.[0];

  if (!app) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  const rp = app.rp_registration?.[0];
  const name = app.app_metadata?.[0]?.name ?? "Untitled app";
  const hasLegacyActions = (data?.action?.length ?? 0) > 0;
  const legacyActionsHref = hasLegacyActions
    ? urls.actions({ team_id: teamId, app_id: appId })
    : undefined;
  const canRegisterRp = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  // No RP registration yet → nudge into the existing enable-World-ID-4.0 flow.
  if (!rp) {
    return (
      <SizingWrapper className="flex flex-col gap-8 py-8">
        {app.is_banned ? <BanBanner /> : null}

        <RegisterRpEmptyState
          appId={appId}
          initialOpen={props.searchParams.enableWorldId4 === "true"}
          canRegisterRp={canRegisterRp}
          isStaging={app.is_staging}
          onRegistered={() => refetch()}
          legacyActionsHref={legacyActionsHref}
        />
      </SizingWrapper>
    );
  }

  const actionItems = (data?.action_v4 ?? []).map((action) => ({
    id: action.id,
    action: action.action,
    description: action.description,
    total: action.total?.aggregate?.count ?? 0,
    latestAt: action.latest?.aggregate?.max?.created_at ?? null,
    points: trendPoints(action),
  }));

  // The weekly hero trend reuses the per-action daily buckets. All time uses a
  // separate app-level query so action-card sparklines remain weekly.
  const weeklyHeroPoints = Array.from({ length: 7 }, (_, day) =>
    actionItems.reduce((sum, action) => sum + (action.points[day] ?? 0), 0),
  );
  const allTimeHeroPoints = trendPoints(appTrendData);
  const heroPoints =
    timePeriod === "all-time" ? allTimeHeroPoints : weeklyHeroPoints;
  const trendState = buildTrendState({
    loading: timePeriod === "all-time" && appTrendLoading,
    error: timePeriod === "all-time" && Boolean(appTrendError),
    points: heroPoints,
    labels: trend.labels,
    onRetry: () => void refetchAppTrend(),
  });

  // Hero totals are summed client-side from the per-action aggregates: the
  // per-action counts use the same filters an app-level aggregate would, and
  // every nullifier row belongs to exactly one action.
  const total = actionItems.reduce((sum, action) => sum + action.total, 0);
  const week = weeklyHeroPoints.reduce((sum, count) => sum + count, 0);

  return (
    <SizingWrapper className="flex flex-col gap-8 py-8">
      {app.is_banned ? <BanBanner /> : null}

      <HeroCard
        name={name}
        appId={appId}
        unique={total}
        week={week}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        trendRangeLabel={trend.rangeLabel}
        trendState={trendState}
      />

      <div className="flex flex-col gap-6">
        <WorldIdTabs
          tab={tab}
          onTabChange={setTab}
          legacyActionsHref={legacyActionsHref}
          search={search}
          onSearchChange={setSearch}
        />

        {tab === "actions" ? (
          <ActionsGrid
            actions={actionItems}
            teamId={teamId}
            appId={appId}
            search={search}
            initialDialogOpen={props.searchParams.createAction === "true"}
            onActionsChanged={() => refetch()}
          />
        ) : (
          <WorldId40Pane
            appId={appId}
            rpId={rp.rp_id}
            initialStatus={(rp.status as RpStatus) ?? "pending"}
            initialStagingStatus={
              rp.staging_status == null ? null : (rp.staging_status as RpStatus)
            }
            mode={rp.mode as string}
            createdAt={rp.created_at}
            onRpChanged={() => refetch()}
          />
        )}
      </div>
    </SizingWrapper>
  );
};
