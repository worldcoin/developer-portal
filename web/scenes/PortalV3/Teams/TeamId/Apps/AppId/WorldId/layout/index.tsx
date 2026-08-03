"use client";

import { Button } from "@/components/Button";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import type { EngineType } from "@/lib/types";
import {
  normalizeWorldIdTab,
  resolveActiveWorldIdTab,
  resolveAvailableWorldIdTab,
  WORLD_ID_TABS,
} from "@/lib/world-id-tabs";
import { DangerZoneSection } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/DangerZoneSection";
import { BanMessageDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/common/BanMessageDialog";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { banMessageDialogOpenedAtom } from "@/scenes/common/Teams/TeamId/Apps/common/BanMessageDialog/atoms";
import {
  GetWorldIdOverviewDocument,
  type GetWorldIdOverviewQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated";
import { useQuery } from "@apollo/client/react";
import { useAtom } from "jotai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RegisterRpEmptyState } from "./RegisterRpEmptyState";
import { RpSummary } from "./RpSummary";
import { ActionsSearchToolbar } from "./ActionsSearchToolbar";
import { WorldIdLayoutSkeleton } from "./Skeleton";
import { getSetupIntent } from "./setup-intent";
import {
  WorldIdLayoutContext,
  type WorldIdLayoutContextValue,
} from "./context";

const BanBanner = () => {
  const [, setIsOpened] = useAtom(banMessageDialogOpenedAtom);

  return (
    <>
      <div className="flex items-center gap-3 rounded-[10px] border border-system-error-200 bg-system-error-50 px-5 py-3 text-system-error-600">
        <AlertIcon
          className={`${opticalIconClassName} text-system-error-600`}
        />
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

export const WorldIdLayout = (props: {
  teamId: string;
  appId: string;
  canManageWorldId: boolean;
  children: ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const enableWorldId4Requested = searchParams.get("enableWorldId4") === "true";
  const createActionRequested = searchParams.get("createAction") === "true";
  const requestedTab = searchParams.get("tab");
  const [setupRequested, setSetupRequested] = useState(false);
  const [createAfterSetup, setCreateAfterSetup] = useState(false);
  // Search is intentionally local UI state, matching the previous Actions
  // page. World ID section changes keep this layout mounted, so the filter
  // survives without creating a second source of truth in the URL.
  const [actionsSearch, setActionsSearch] = useState("");
  const [reconciledRpStatus, setReconciledRpStatus] = useState<{
    rpId: string;
    status: RpRegistrationStatus;
    serverStatus: unknown;
  } | null>(null);
  const searchParamsString = searchParams.toString();
  const pendingSearchParamsRef = useRef(searchParamsString);
  const pendingSearchParamsTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const pendingTarget = pendingSearchParamsTargetRef.current;
    if (pendingTarget !== null && pendingTarget !== searchParamsString) return;

    pendingSearchParamsRef.current = searchParamsString;
    pendingSearchParamsTargetRef.current = null;
  }, [searchParamsString]);

  const updateSearchParams = useCallback(
    (update: (nextSearchParams: URLSearchParams) => void) => {
      const nextSearchParams = new URLSearchParams(
        pendingSearchParamsRef.current,
      );
      const previousQuery = nextSearchParams.toString();
      update(nextSearchParams);
      const query = nextSearchParams.toString();
      if (query === previousQuery) return;

      // Compose another query update against this target even if Next has not
      // committed the preceding replace yet.
      pendingSearchParamsRef.current = query;
      pendingSearchParamsTargetRef.current = query;
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const consumeSearchParams = useCallback(
    (...names: string[]) => {
      updateSearchParams((nextSearchParams) => {
        for (const name of names) nextSearchParams.delete(name);
      });
    },
    [updateSearchParams],
  );

  const { data, loading, error, refetch } = useQuery(
    GetWorldIdOverviewDocument,
    {
      variables: { app_id: props.appId },
      skip: !props.appId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
  );

  const app = data?.app?.[0];
  const appMetadata = app?.app_metadata?.[0] ?? app?.verified_app_metadata?.[0];
  const rp = app?.rp_registration?.[0];
  const hasResolvedApp = Boolean(app);
  const hasRpRegistration = Boolean(rp);
  const hasLegacyActions = (data?.action?.length ?? 0) > 0;
  const effectiveRpStatus =
    reconciledRpStatus &&
    reconciledRpStatus.rpId === rp?.rp_id &&
    reconciledRpStatus.serverStatus === rp?.status
      ? reconciledRpStatus.status
      : rp?.status;
  const hasActiveRp = effectiveRpStatus === RpRegistrationStatus.Registered;
  const availableTab = resolveAvailableWorldIdTab({
    requestedTab,
    hasRpRegistration,
    hasLegacyActions,
  });
  const activeTab = resolveActiveWorldIdTab({
    requestedTab,
    hasRpRegistration,
    hasActiveRp,
    hasLegacyActions,
    enableRequested: enableWorldId4Requested,
    createRequested: createActionRequested || createAfterSetup,
  });
  const normalizedRequestedTab = normalizeWorldIdTab(requestedTab);
  const shouldNormalizeTab =
    (requestedTab === null && !hasRpRegistration && !createActionRequested) ||
    (requestedTab !== null &&
      (requestedTab !== normalizedRequestedTab ||
        (!createActionRequested &&
          !enableWorldId4Requested &&
          requestedTab !== availableTab)));
  const { openSetup, openAction, consumeEnable, consumeCreate } =
    getSetupIntent({
      enableRequested: enableWorldId4Requested,
      createRequested: createActionRequested,
      hasRpRegistration,
      hasActiveRp,
      isStaging: Boolean(app?.is_staging),
      canManageWorldId: props.canManageWorldId,
    });
  const hasCreateIntent =
    createAfterSetup || (createActionRequested && !consumeCreate);

  const hasBootstrappedCreateIntent = useRef(false);
  useEffect(() => {
    if (loading || !hasResolvedApp || !hasCreateIntent || hasRpRegistration) {
      return;
    }
    if (hasBootstrappedCreateIntent.current) return;

    hasBootstrappedCreateIntent.current = true;
    setSetupRequested(true);
  }, [hasCreateIntent, hasResolvedApp, hasRpRegistration, loading]);

  useEffect(() => {
    const consumedParams: string[] = [];

    if (consumeEnable) consumedParams.push("enableWorldId4");
    if (consumeCreate) {
      setCreateAfterSetup(false);
      consumedParams.push("createAction");
    }

    if (consumedParams.length > 0) {
      updateSearchParams((nextSearchParams) => {
        // A bare enable deep link should stay on World ID after its one-shot
        // dialog intent is consumed. Preserve an explicit caller-owned tab.
        if (consumeEnable && !nextSearchParams.has("tab")) {
          nextSearchParams.set("tab", WORLD_ID_TABS.Configuration);
        }

        for (const name of consumedParams) nextSearchParams.delete(name);
      });
    }
  }, [consumeCreate, consumeEnable, updateSearchParams]);

  useEffect(() => {
    if (!hasResolvedApp || !shouldNormalizeTab) {
      return;
    }

    updateSearchParams((nextSearchParams) => {
      nextSearchParams.set("tab", availableTab);
    });
  }, [hasResolvedApp, shouldNormalizeTab, updateSearchParams, availableTab]);

  const refetchOverview = useCallback(
    () => void refetch().catch(() => {}),
    [refetch],
  );
  const waitForOverviewRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRpChanged = useCallback(
    (status?: RpRegistrationStatus) => {
      if (status && rp) {
        setReconciledRpStatus({
          rpId: rp.rp_id,
          status,
          serverStatus: rp.status,
        });
      }
      refetchOverview();
    },
    [refetchOverview, rp],
  );

  useEffect(() => {
    if (!props.appId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      refetchOverview();
    };
    const handleFocus = () => refetchOverview();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [props.appId, refetchOverview]);

  const rpId = rp?.rp_id;
  const rpServerStatus = rp?.status;
  // The rp-status endpoint is what reconciles a pending registration (it reads
  // on-chain state and syncs the DB row), but its usual host — RpSummary —
  // only mounts on the Configuration section. Keep pending converging while
  // the user sits on Actions so the grid unlocks without a manual refresh.
  useEffect(() => {
    if (!rpId || activeTab === WORLD_ID_TABS.Configuration) return;
    if (effectiveRpStatus !== RpRegistrationStatus.Pending) return;

    let cancelled = false;
    const reconcile = async () => {
      try {
        const response = await fetch(`/api/v4/rp-status/${rpId}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (cancelled || !response.ok) return;
        const result = (await response.json()) as { production_status: string };
        if (result.production_status !== rpServerStatus) refetchOverview();
      } catch {
        // Retain the last known status when reconciliation is unavailable.
      }
    };

    void reconcile();
    const interval = setInterval(() => {
      if (!document.hidden) void reconcile();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTab, effectiveRpStatus, refetchOverview, rpId, rpServerStatus]);

  const consumeCreateAction = useCallback(() => {
    setCreateAfterSetup(false);
    consumeSearchParams("createAction");
  }, [consumeSearchParams]);

  const actions = useMemo(
    () =>
      (data?.action_v4 ?? []).map(
        (action: GetWorldIdOverviewQuery["action_v4"][number]) => ({
          id: action.id,
          action: action.action,
          description: action.description,
        }),
      ),
    [data?.action_v4],
  );
  const initialLoading = loading && !data;
  const contextValue = useMemo<WorldIdLayoutContextValue>(
    () => ({
      teamId: props.teamId,
      appId: props.appId,
      canManageWorldId: props.canManageWorldId,
      activeTab,
      appEngine: app?.engine as EngineType | undefined,
      actions,
      actionsSearch,
      hasActiveRp,
      shouldOpenCreateAction: openAction || (hasCreateIntent && hasActiveRp),
      consumeCreateAction,
      refreshOverview: refetchOverview,
    }),
    [
      activeTab,
      actions,
      actionsSearch,
      app?.engine,
      consumeCreateAction,
      hasActiveRp,
      hasCreateIntent,
      openAction,
      props.appId,
      props.canManageWorldId,
      props.teamId,
      refetchOverview,
    ],
  );

  if (error && !data) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={500} title="Failed to load World ID" />
      </SizingWrapper>
    );
  }

  if (!loading && !app) {
    return (
      <SizingWrapper className="py-8">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  return (
    <WorldIdLayoutContext.Provider value={contextValue}>
      <SizingWrapper className="flex flex-col gap-8 py-8">
        {app?.is_banned ? <BanBanner /> : null}

        {initialLoading && (
          <WorldIdLayoutSkeleton
            // Deep-link intents pin the destination before data arrives,
            // mirroring resolveActiveWorldIdTab's intent-first branches:
            // enable always lands on Configuration; create does too until an
            // active RP is known (the dialog then opens over Actions).
            tab={
              createActionRequested || enableWorldId4Requested
                ? WORLD_ID_TABS.Configuration
                : normalizedRequestedTab
            }
            appId={props.appId}
            canManageWorldId={props.canManageWorldId}
          />
        )}
        {!initialLoading && (
          <div className="flex flex-col gap-6">
            {activeTab !== WORLD_ID_TABS.Configuration ? (
              <ActionsSearchToolbar
                search={actionsSearch}
                onSearchChange={setActionsSearch}
              />
            ) : null}

            {activeTab === WORLD_ID_TABS.Configuration ? (
              <div className="flex flex-col gap-4">
                <Typography
                  as="h2"
                  variant={TYPOGRAPHY.H7}
                  className="text-portal-ink"
                >
                  World ID Configuration
                </Typography>

                {rp ? (
                  <RpSummary
                    appId={props.appId}
                    rpId={rp.rp_id}
                    signerAddress={rp.signer_address ?? null}
                    initialStatus={
                      (effectiveRpStatus as RpRegistrationStatus) ??
                      RpRegistrationStatus.Pending
                    }
                    initialStagingStatus={
                      rp.staging_status == null
                        ? null
                        : (rp.staging_status as RpRegistrationStatus)
                    }
                    mode={rp.mode as string}
                    canManageWorldId={props.canManageWorldId}
                    onRpChanged={handleRpChanged}
                  />
                ) : app ? (
                  <RegisterRpEmptyState
                    appId={props.appId}
                    initialOpen={openSetup || setupRequested}
                    isStaging={app.is_staging}
                    canManageWorldId={props.canManageWorldId}
                    onRegistered={waitForOverviewRefresh}
                    onSetupClosed={(completed) => {
                      setSetupRequested(false);
                      if (completed) {
                        consumeSearchParams("enableWorldId4");
                      } else {
                        setCreateAfterSetup(false);
                        consumeSearchParams("enableWorldId4", "createAction");
                      }
                    }}
                  />
                ) : null}

                {rp ? (
                  <div className="w-full max-w-[580px]">
                    <DangerZoneSection
                      appId={props.appId}
                      teamId={props.teamId}
                      appName={appMetadata?.name ?? props.appId}
                      variant="compact"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              props.children
            )}
          </div>
        )}
      </SizingWrapper>
    </WorldIdLayoutContext.Provider>
  );
};
