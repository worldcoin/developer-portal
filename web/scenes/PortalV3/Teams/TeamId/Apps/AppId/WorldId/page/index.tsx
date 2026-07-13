"use client";

import { Button } from "@/components/Button";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { trendPoints, type TrendPeriod } from "@/lib/day-buckets";
import { urls } from "@/lib/urls";
import {
  buildTrendState,
  useTrendWindow,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/use-trend-window";
import { BanMessageDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/common/BanMessageDialog";
import { banMessageDialogOpenedAtom } from "@/scenes/common/Teams/TeamId/Apps/common/BanMessageDialog/atoms";
import { useGetWorldIdAppTrendQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/graphql/client/get-world-id-trends.generated";
import { useGetWorldIdOverviewQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated";
import { useAtom } from "jotai";
import { type ReactNode, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { ActionsGrid } from "./ActionsGrid";
import { HeroCard } from "./HeroCard";
import { RegisterRpEmptyState } from "./RegisterRpEmptyState";
import { WorldId40Pane, type RpStatus } from "./WorldId40Pane";
import { WorldIdTab, WorldIdTabs } from "./WorldIdTabs";

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
  const enableWorldId4Requested = props.searchParams.enableWorldId4 === "true";
  const createActionRequested = props.searchParams.createAction === "true";

  const [tab, setTab] = useState<WorldIdTab>(
    props.searchParams.tab === "world-id-4-0" || enableWorldId4Requested
      ? "world-id-4-0"
      : "actions",
  );
  const [search, setSearch] = useState("");
  const [timePeriod, setTimePeriod] = useState<TrendPeriod>("weekly");

  // RP creation time determines the all-time query window.
  const [rpCreatedAt, setRpCreatedAt] = useState<string>();
  const trend = useTrendWindow({ createdAt: rpCreatedAt, timePeriod });

  const { data, loading, error, refetch } = useGetWorldIdOverviewQuery({
    variables: {
      app_id: appId,
      ...trend.weeklyVariables,
    },
    skip: !appId,
  });

  const app = data?.app?.[0];
  const rp = app?.rp_registration?.[0];
  const hasResolvedApp = Boolean(app);
  const hasRpRegistration = Boolean(rp);
  const fetchedRpCreatedAt = rp?.created_at;
  useEffect(() => {
    if (fetchedRpCreatedAt) setRpCreatedAt(fetchedRpCreatedAt as string);
  }, [fetchedRpCreatedAt]);

  // A create-action deep link cannot open the action dialog until the app has
  // an RP. Send RP-less apps to the same setup pane as the in-page + card.
  useEffect(() => {
    if (
      !loading &&
      hasResolvedApp &&
      !hasRpRegistration &&
      createActionRequested
    ) {
      setTab("world-id-4-0");
    }
  }, [createActionRequested, hasResolvedApp, hasRpRegistration, loading]);

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

  // Apollo exposes refetch failures through query error state.
  const refetchOverview = () => void refetch().catch(() => {});

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

  // Preserve cached content when a refetch fails.
  if (error && !data) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={500} title="Failed to load World ID" />
      </SizingWrapper>
    );
  }

  if (!app) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  const name = app.app_metadata?.[0]?.name ?? "Untitled app";
  const hasLegacyActions = (data?.action?.length ?? 0) > 0;
  const legacyActionsHref = hasLegacyActions
    ? urls.actions({ team_id: teamId, app_id: appId })
    : undefined;

  const actionItems = (data?.action_v4 ?? []).map((action) => ({
    id: action.id,
    action: action.action,
    description: action.description,
    total: action.total?.aggregate?.count ?? 0,
    latestAt: action.latest?.aggregate?.max?.created_at ?? null,
    points: trendPoints(action),
  }));

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
    onRetry: () => void refetchAppTrend().catch(() => {}),
  });

  // Each nullifier belongs to exactly one action.
  const uniqueVerifications = actionItems.reduce(
    (sum, action) => sum + action.total,
    0,
  );
  const week = weeklyHeroPoints.reduce((sum, count) => sum + count, 0);

  let tabContent: ReactNode;
  if (tab === "actions") {
    tabContent = (
      <ActionsGrid
        actions={actionItems}
        teamId={teamId}
        appId={appId}
        search={search}
        initialDialogOpen={hasRpRegistration && createActionRequested}
        onCreateActionRequested={
          hasRpRegistration ? undefined : () => setTab("world-id-4-0")
        }
        onActionsChanged={refetchOverview}
      />
    );
  } else if (rp) {
    tabContent = (
      <WorldId40Pane
        appId={appId}
        rpId={rp.rp_id}
        initialStatus={(rp.status as RpStatus) ?? "pending"}
        initialStagingStatus={
          rp.staging_status == null ? null : (rp.staging_status as RpStatus)
        }
        mode={rp.mode as string}
        createdAt={rp.created_at}
        onRpChanged={refetchOverview}
      />
    );
  } else {
    tabContent = (
      <RegisterRpEmptyState
        appId={appId}
        initialOpen={enableWorldId4Requested}
        isStaging={app.is_staging}
        onRegistered={refetchOverview}
        legacyActionsHref={legacyActionsHref}
      />
    );
  }

  return (
    <SizingWrapper className="flex flex-col gap-8 py-8">
      {app.is_banned ? <BanBanner /> : null}

      <HeroCard
        name={name}
        appId={appId}
        uniqueVerifications={uniqueVerifications}
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
        {tabContent}
      </div>
    </SizingWrapper>
  );
};
