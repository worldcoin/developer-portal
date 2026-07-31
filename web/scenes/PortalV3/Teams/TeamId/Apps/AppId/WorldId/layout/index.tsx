"use client";

import { Button } from "@/components/Button";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { SkeletonForm } from "@/components/Skeletons";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { urls } from "@/lib/urls";
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
import { getSetupIntent } from "./setup-intent";
import { WorldIdTabs } from "./Tabs";
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
  const obsoleteSettingsTab = searchParams.get("tab") === "world-id-4-0";
  const [setupRequested, setSetupRequested] = useState(false);
  const [createAfterSetup, setCreateAfterSetup] = useState(false);
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

  const consumeSearchParams = useCallback(
    (...names: string[]) => {
      const nextSearchParams = new URLSearchParams(
        pendingSearchParamsRef.current,
      );
      if (!names.some((name) => nextSearchParams.has(name))) return;

      for (const name of names) nextSearchParams.delete(name);
      const query = nextSearchParams.toString();
      // Compose another consumption against this target even if Next has not
      // committed the preceding replace yet.
      pendingSearchParamsRef.current = query;
      pendingSearchParamsTargetRef.current = query;
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
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
  const rp = app?.rp_registration?.[0];
  const hasResolvedApp = Boolean(app);
  const hasRpRegistration = Boolean(rp);
  const effectiveRpStatus =
    reconciledRpStatus &&
    reconciledRpStatus.rpId === rp?.rp_id &&
    reconciledRpStatus.serverStatus === rp?.status
      ? reconciledRpStatus.status
      : rp?.status;
  const hasActiveRp = effectiveRpStatus === RpRegistrationStatus.Registered;
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
    if (loading || !hasResolvedApp || !hasCreateIntent || hasActiveRp) return;
    if (hasBootstrappedCreateIntent.current) return;

    hasBootstrappedCreateIntent.current = true;
    setSetupRequested(true);
  }, [hasActiveRp, hasCreateIntent, hasResolvedApp, loading]);

  useEffect(() => {
    const consumedParams: string[] = [];

    if (obsoleteSettingsTab) consumedParams.push("tab");
    if (consumeEnable) consumedParams.push("enableWorldId4");
    if (consumeCreate) {
      setCreateAfterSetup(false);
      consumedParams.push("createAction");
    }

    if (consumedParams.length > 0) {
      consumeSearchParams(...consumedParams);
    }
  }, [consumeCreate, consumeEnable, consumeSearchParams, obsoleteSettingsTab]);

  const refetchOverview = useCallback(
    () => void refetch().catch(() => {}),
    [refetch],
  );

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

  const requestCreateActionSetup = useCallback(() => {
    if (!props.canManageWorldId) return;

    setCreateAfterSetup(true);
    setSetupRequested(true);
  }, [props.canManageWorldId]);

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
      actions,
      actionsSearch,
      hasActiveRp,
      shouldOpenCreateAction: openAction || (hasCreateIntent && hasActiveRp),
      requestCreateActionSetup,
      consumeCreateAction,
      refreshOverview: refetchOverview,
    }),
    [
      actions,
      actionsSearch,
      consumeCreateAction,
      hasActiveRp,
      hasCreateIntent,
      openAction,
      props.appId,
      props.canManageWorldId,
      props.teamId,
      refetchOverview,
      requestCreateActionSetup,
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

  const hasLegacyActions = (data?.action?.length ?? 0) > 0;
  const legacyActionsPath = urls.worldIdLegacyActions({
    team_id: props.teamId,
    app_id: props.appId,
  });
  const isLegacyActionsRoute =
    pathname === legacyActionsPath ||
    pathname.startsWith(`${legacyActionsPath}/`);
  const showContent = hasRpRegistration || isLegacyActionsRoute;
  const showTabs = hasRpRegistration || hasLegacyActions;

  return (
    <WorldIdLayoutContext.Provider value={contextValue}>
      <SizingWrapper className="flex flex-col gap-8 py-8">
        {app?.is_banned ? <BanBanner /> : null}

        <div className="flex flex-col gap-4">
          {initialLoading ? (
            <div className="rounded-xl border border-grey-100 bg-white p-5">
              <SkeletonForm count={3} className="max-w-[760px] py-2" />
            </div>
          ) : rp ? (
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
              createdAt={rp.created_at}
              canManageWorldId={props.canManageWorldId}
              onRpChanged={handleRpChanged}
            />
          ) : app ? (
            <RegisterRpEmptyState
              appId={props.appId}
              initialOpen={openSetup || setupRequested}
              isStaging={app.is_staging}
              canManageWorldId={props.canManageWorldId}
              onRegistered={refetchOverview}
              legacyActionsHref={
                hasLegacyActions && !isLegacyActionsRoute
                  ? legacyActionsPath
                  : undefined
              }
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
        </div>

        {showContent ? (
          <div className="flex flex-col gap-6">
            {showTabs ? (
              <WorldIdTabs
                teamId={props.teamId}
                appId={props.appId}
                hasLegacyActions={hasLegacyActions}
                showActions={hasRpRegistration}
                search={actionsSearch}
                onSearchChange={setActionsSearch}
              />
            ) : null}
            {props.children}
          </div>
        ) : null}
      </SizingWrapper>
    </WorldIdLayoutContext.Provider>
  );
};
