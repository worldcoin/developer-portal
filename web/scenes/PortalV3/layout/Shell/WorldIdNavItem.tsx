"use client";

import { urls } from "@/lib/urls";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import {
  normalizeWorldIdTab,
  resolveActiveWorldIdTab,
  WORLD_ID_TABS,
} from "@/lib/world-id-tabs";
import { GetWorldIdNavigationDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/navigation/graphql/client/get-world-id-navigation.generated";
import { useQuery } from "@apollo/client/react";
import {
  HistoryIcon,
  ListChecksIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { NavItem } from "./NavItem";
import {
  type GetSidebarNavigationHandler,
  SidebarSubNavigation,
} from "./SidebarSubNavigation";

export const WorldIdNavItem = (props: {
  teamId: string;
  appId: string;
  active: boolean;
  currentPathname: string;
  optimisticHref: string | null;
  icon: ReactNode;
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
    skip: !props.active,
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

  const items = [
    ...(showActions
      ? [
          {
            label: "Actions",
            href: urls.worldIdTab({ ...ids, tab: WORLD_ID_TABS.Actions }),
            active: actionsActive,
            icon: <ListChecksIcon strokeWidth={1.5} className="size-4" />,
          },
        ]
      : []),
    {
      label: "Configuration",
      href: urls.worldIdTab({ ...ids, tab: WORLD_ID_TABS.Configuration }),
      active: configurationActive,
      icon: <SlidersHorizontalIcon strokeWidth={1.5} className="size-4" />,
    },
    ...(showLegacyActions
      ? [
          {
            label: "Legacy actions",
            href: urls.worldIdTab({
              ...ids,
              tab: WORLD_ID_TABS.LegacyActions,
            }),
            active: legacyActionsActive,
            icon: <HistoryIcon strokeWidth={1.5} className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <NavItem
      label="World ID"
      href={worldIdHref}
      active={props.active}
      current={false}
      onNavigate={props.getNavigationHandler(worldIdHref)}
      icon={props.icon}
    >
      {props.active ? (
        <SidebarSubNavigation
          label="World ID navigation"
          items={items}
          getNavigationHandler={props.getNavigationHandler}
        />
      ) : null}
    </NavItem>
  );
};
