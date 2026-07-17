"use client";

import { Button } from "@/components/Button";
import { ErrorPage } from "@/components/ErrorPage";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { urls } from "@/lib/urls";
import { BanMessageDialog } from "@/scenes/PortalV3/Teams/TeamId/Apps/common/BanMessageDialog";
import { banMessageDialogOpenedAtom } from "@/scenes/common/Teams/TeamId/Apps/common/BanMessageDialog/atoms";
import { useGetWorldIdOverviewQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated";
import { useAtom } from "jotai";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import { ActionsGrid } from "./ActionsGrid";
import { RegisterRpEmptyState } from "./RegisterRpEmptyState";
import { getSetupIntent } from "./setup-intent";
import { WorldId40Pane } from "./WorldId40Pane";
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
  canManageWorldId: boolean;
}) => {
  const teamId = props.params.teamId ?? "";
  const appId = props.params.appId ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const enableWorldId4Requested = searchParams.get("enableWorldId4") === "true";
  const createActionRequested = searchParams.get("createAction") === "true";

  const consumeSearchParams = useCallback(
    (...names: string[]) => {
      if (!names.some((name) => searchParams.has(name))) return;

      const nextSearchParams = new URLSearchParams(searchParams);
      for (const name of names) nextSearchParams.delete(name);
      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const [tab, setTab] = useState<WorldIdTab>(
    props.searchParams.tab === "world-id-4-0" || enableWorldId4Requested
      ? "world-id-4-0"
      : "actions",
  );
  const [createAfterSetup, setCreateAfterSetup] = useState(
    createActionRequested && props.canManageWorldId,
  );
  const [search, setSearch] = useState("");
  const [reconciledRpStatus, setReconciledRpStatus] = useState<{
    rpId: string;
    status: RpRegistrationStatus;
  } | null>(null);

  const selectTab = useCallback(
    (
      nextTab: WorldIdTab,
      options?: {
        /** Drop funnel params in the same replace so a second stale replace can't revive them. */
        clearParams?: string[];
      },
    ) => {
      setTab(nextTab);

      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (nextTab === "world-id-4-0") {
        nextSearchParams.set("tab", "world-id-4-0");
      } else {
        nextSearchParams.delete("tab");
      }
      for (const name of options?.clearParams ?? []) {
        nextSearchParams.delete(name);
      }

      const query = nextSearchParams.toString();
      if (query === searchParams.toString()) return;
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // User-initiated tab changes abandon the deferred create-after-setup funnel.
  // Programmatic selectTab calls (deep-link bootstrap / post-setup resume) must
  // not go through this, or they'd clear the intent before the create dialog opens.
  const handleTabChange = useCallback(
    (nextTab: WorldIdTab) => {
      setCreateAfterSetup(false);
      selectTab(nextTab, { clearParams: ["createAction"] });
    },
    [selectTab],
  );

  const requestedTab: WorldIdTab =
    searchParams.get("tab") === "world-id-4-0" || enableWorldId4Requested
      ? "world-id-4-0"
      : "actions";

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  const { data, loading, error, refetch } = useGetWorldIdOverviewQuery({
    variables: { app_id: appId },
    skip: !appId,
  });

  const app = data?.app?.[0];
  const rp = app?.rp_registration?.[0];
  const hasResolvedApp = Boolean(app);
  const hasRpRegistration = Boolean(rp);
  const effectiveRpStatus =
    reconciledRpStatus && reconciledRpStatus.rpId === rp?.rp_id
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

  // Only react to async RP/data for the create-after-setup funnel:
  // - one-shot: deep-link with no RP → World ID setup tab
  // - resume: RP becomes registered → Actions (create dialog opens via state)
  // Button clicks already call selectTab; do not re-force World ID after that.
  const hasBootstrappedCreateIntent = useRef(false);
  useEffect(() => {
    if (loading || !hasResolvedApp || !createAfterSetup) return;

    if (hasActiveRp) {
      selectTab("actions");
      return;
    }

    if (hasBootstrappedCreateIntent.current) return;
    hasBootstrappedCreateIntent.current = true;
    selectTab("world-id-4-0");
  }, [createAfterSetup, hasActiveRp, hasResolvedApp, loading, selectTab]);

  useEffect(() => {
    if (consumeEnable) {
      consumeSearchParams("enableWorldId4");
    }
  }, [consumeEnable, consumeSearchParams]);

  useEffect(() => {
    if (consumeCreate) {
      setCreateAfterSetup(false);
      consumeSearchParams("createAction");
    }
  }, [consumeCreate, consumeSearchParams]);

  const refetchOverview = useCallback(
    () => void refetch().catch(() => {}),
    [refetch],
  );

  const handleRpChanged = useCallback(
    (status?: RpRegistrationStatus) => {
      if (status && rp) {
        setReconciledRpStatus({ rpId: rp.rp_id, status });
      }
      refetchOverview();
    },
    [refetchOverview, rp],
  );

  if (loading) {
    return (
      <SizingWrapper className="flex flex-col gap-8 py-8">
        <Skeleton height={76} className="rounded-[10px]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton height={144} count={3} className="rounded-[10px]" />
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

  const hasLegacyActions = (data?.action?.length ?? 0) > 0;
  const legacyActionsHref = hasLegacyActions
    ? urls.actions({ team_id: teamId, app_id: appId })
    : undefined;

  const actionItems = (data?.action_v4 ?? []).map((action) => ({
    id: action.id,
    action: action.action,
    description: action.description,
  }));

  let tabContent: ReactNode;
  if (tab === "actions") {
    tabContent = (
      <ActionsGrid
        actions={actionItems}
        teamId={teamId}
        appId={appId}
        search={search}
        canCreate={props.canManageWorldId}
        initialDialogOpen={openAction || (createAfterSetup && hasActiveRp)}
        onCreateActionRequested={
          hasActiveRp
            ? undefined
            : () => {
                setCreateAfterSetup(true);
                selectTab("world-id-4-0");
              }
        }
        onCreateActionConsumed={() => {
          setCreateAfterSetup(false);
          consumeSearchParams("createAction");
        }}
        onActionsChanged={refetchOverview}
      />
    );
  } else if (rp) {
    tabContent = (
      <WorldId40Pane
        appId={appId}
        rpId={rp.rp_id}
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
    );
  } else {
    tabContent = (
      <RegisterRpEmptyState
        appId={appId}
        initialOpen={openSetup}
        isStaging={app.is_staging}
        canManageWorldId={props.canManageWorldId}
        onRegistered={refetchOverview}
        onSetupClosed={(completed) => {
          if (completed) {
            consumeSearchParams("enableWorldId4");
          } else {
            setCreateAfterSetup(false);
            consumeSearchParams("enableWorldId4", "createAction");
          }
        }}
        legacyActionsHref={legacyActionsHref}
      />
    );
  }

  return (
    <SizingWrapper className="flex flex-col gap-8 py-8">
      {app.is_banned ? <BanBanner /> : null}

      <div className="flex flex-col gap-6">
        <WorldIdTabs
          tab={tab}
          onTabChange={handleTabChange}
          legacyActionsHref={legacyActionsHref}
          search={search}
          onSearchChange={setSearch}
        />
        {tabContent}
      </div>
    </SizingWrapper>
  );
};
