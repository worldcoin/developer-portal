"use client";

import { urls } from "@/lib/urls";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import {
  normalizeWorldIdTab,
  resolveActiveWorldIdTab,
  WORLD_ID_TABS,
} from "@/lib/world-id-tabs";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { GetWorldIdNavigationDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/navigation/graphql/client/get-world-id-navigation.generated";
import { useQuery } from "@apollo/client/react";
import { HistoryIcon, ListChecksIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { MouseEventHandler } from "react";
import { NavItem } from "./NavItem";

type GetSidebarNavigationHandler = (
  href: string,
) => MouseEventHandler<HTMLAnchorElement>;

export const WorldIdNavItems = (props: {
  teamId: string;
  appId: string;
  currentPathname: string;
  optimisticHref: string | null;
  getNavigationHandler: GetSidebarNavigationHandler;
}) => {
  const ids = { team_id: props.teamId, app_id: props.appId };
  const appBase = urls.app(ids);
  const worldIdHref = urls.worldId(ids);
  const committedSearchParams = useSearchParams();

  const withinApp = (prefix: string) => {
    if (!props.currentPathname.startsWith(appBase)) return false;
    const relativePath = props.currentPathname.slice(appBase.length);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  };

  const { data } = useQuery(GetWorldIdNavigationDocument, {
    variables: { app_id: props.appId },
    skip: false,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const app = data?.app?.[0];
  const rp = app?.rp_registration?.[0];
  const hasResolvedApp = app?.id === props.appId;
  const hasRpRegistration = hasResolvedApp && Boolean(rp);
  const hasActiveRp =
    hasRpRegistration && rp?.status === RpRegistrationStatus.Registered;
  const hasLegacyActions = hasResolvedApp && (data?.action?.length ?? 0) > 0;
  const navigationSearchParams =
    props.optimisticHref === null
      ? committedSearchParams
      : new URL(props.optimisticHref, "https://portal.local").searchParams;
  const requestedTab = normalizeWorldIdTab(navigationSearchParams.get("tab"));
  const activeTab = hasResolvedApp
    ? resolveActiveWorldIdTab({
        requestedTab,
        hasRpRegistration,
        hasActiveRp,
        hasLegacyActions,
        enableRequested:
          navigationSearchParams.get("enableWorldId4") === "true",
        createRequested: navigationSearchParams.get("createAction") === "true",
      })
    : requestedTab;
  const onCanonicalLanding =
    props.currentPathname === appBase || props.currentPathname === worldIdHref;
  const onActionsRoute = withinApp("/world-id-actions");
  const onConfigurationRoute = withinApp("/world-id-4-0");
  const onLegacyActionsRoute =
    withinApp("/actions") || withinApp("/world-id/legacy-actions");

  const actionsActive =
    onActionsRoute ||
    (onCanonicalLanding && activeTab === WORLD_ID_TABS.Actions);
  const configurationActive =
    onConfigurationRoute ||
    (onCanonicalLanding && activeTab === WORLD_ID_TABS.Configuration);
  const legacyActionsActive =
    onLegacyActionsRoute ||
    (onCanonicalLanding && activeTab === WORLD_ID_TABS.LegacyActions);
  const showActions =
    hasRpRegistration ||
    onActionsRoute ||
    (!hasResolvedApp && requestedTab === WORLD_ID_TABS.Actions);
  const showLegacyActions =
    hasLegacyActions ||
    onLegacyActionsRoute ||
    (!hasResolvedApp && requestedTab === WORLD_ID_TABS.LegacyActions);
  const actionsHref = urls.worldIdTab({ ...ids, tab: WORLD_ID_TABS.Actions });
  const configurationHref = urls.worldIdTab({
    ...ids,
    tab: WORLD_ID_TABS.Configuration,
  });
  const legacyActionsHref = urls.worldIdTab({
    ...ids,
    tab: WORLD_ID_TABS.LegacyActions,
  });

  return (
    <>
      {showActions ? (
        <NavItem
          label="Actions"
          href={actionsHref}
          active={actionsActive}
          onNavigate={props.getNavigationHandler(actionsHref)}
          icon={<ListChecksIcon strokeWidth={1.5} className="size-4" />}
        />
      ) : null}
      <NavItem
        label="Configuration"
        href={configurationHref}
        active={configurationActive}
        onNavigate={props.getNavigationHandler(configurationHref)}
        icon={<Icon name="nav-configuration" className="size-4" />}
      />
      {showLegacyActions ? (
        <NavItem
          label="Legacy actions"
          href={legacyActionsHref}
          active={legacyActionsActive}
          onNavigate={props.getNavigationHandler(legacyActionsHref)}
          icon={<HistoryIcon strokeWidth={1.5} className="size-4" />}
        />
      ) : null}
    </>
  );
};
