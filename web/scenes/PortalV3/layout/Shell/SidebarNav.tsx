"use client";

import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import {
  getPortalAppContext,
  getPortalReturnTo,
  isTeamSettingsPath,
  resolveTeamSettingsTab,
  TEAM_SETTINGS_TABS,
} from "@/lib/team-settings";
import { urls } from "@/lib/urls";
import {
  normalizeWorldIdTab,
  resolveActiveWorldIdTab,
  WORLD_ID_TABS,
} from "@/lib/world-id-tabs";
import { Icon, preloadIcons } from "@/scenes/PortalV3/common/Icon";
import { GetWorldIdNavigationDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/navigation/graphql/client/get-world-id-navigation.generated";
import { useQuery } from "@apollo/client/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  createContext,
  type MouseEventHandler,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { NavActivePill, NavItem } from "./NavItem";
import { SandboxButton } from "./SandboxButton";

type ShellNavigation = {
  /** Target href of an in-flight sidebar navigation, until the route commits. */
  pendingHref: string | null;
  isNavigating: boolean;
  navigate: (href: string) => void;
};

const ShellNavigationContext = createContext<ShellNavigation | null>(null);

const useShellNavigation = (): ShellNavigation => {
  const value = useContext(ShellNavigationContext);
  if (!value) {
    throw new Error(
      "useShellNavigation must be used inside SidebarAnimationShell",
    );
  }
  return value;
};

/**
 * Owns optimistic tab-navigation state. Mounted once in PortalShell so the
 * sidebar and content column read the same in-flight navigation.
 */
export const SidebarAnimationShell = (props: { children: ReactNode }) => {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      setPendingHref(href);
      startTransition(() => router.push(href));
    },
    [router],
  );

  const value = useMemo(
    () => ({ pendingHref, isNavigating, navigate }),
    [pendingHref, isNavigating, navigate],
  );

  return (
    <ShellNavigationContext.Provider value={value}>
      {props.children}
    </ShellNavigationContext.Provider>
  );
};

const sidebarPreloadIcons = [
  "nav-home-active",
  "nav-badge-check",
  "nav-credential",
  "nav-delivery-check",
  "nav-arrows-transfer",
  "nav-bell",
  "nav-settings-active",
  "nav-group",
  "nav-key",
  "view-grid-active",
  "world-id-sandbox-app-icon",
] as const;

const SidebarGlyph = (props: { name: string; className?: string }) => (
  <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden">
    <Icon name={props.name} className={props.className ?? "size-4"} />
  </span>
);

const SectionLabel = (props: { children: ReactNode }) => (
  <SidebarGroupLabel className="h-8 rounded-none px-2 font-world text-13 leading-[1.2] font-[450] text-portal-subtle">
    {props.children}
  </SidebarGroupLabel>
);

export const SidebarNav = (props: {
  initialSandboxRequest?: SandboxAccessRequestState | null;
  apiKeyTeamIds?: string[];
}) => {
  preloadIcons(sidebarPreloadIcons);

  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const committedSearchParams = useSearchParams();
  const teamId = params?.teamId;
  const routeAppId = params?.appId;
  const { setOpenMobile } = useSidebar();

  const { pendingHref, isNavigating, navigate } = useShellNavigation();
  const optimisticHref =
    isNavigating && pendingHref !== null ? pendingHref : null;
  const currentHref = optimisticHref ?? pathname;
  const currentPathname = currentHref.split(/[?#]/, 1)[0];
  const currentSearchParams = optimisticHref
    ? new URLSearchParams(optimisticHref.split("?", 2)[1] ?? "")
    : committedSearchParams;

  const beginNavigation =
    (href: string): MouseEventHandler<HTMLAnchorElement> =>
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      navigate(href);
    };

  // On mobile the navigation mounts inside the sheet. Close it only after a
  // route change, not on the initial mount that opened the sheet.
  const previousHrefRef = useRef(currentHref);
  useEffect(() => {
    if (previousHrefRef.current === currentHref) return;
    previousHrefRef.current = currentHref;
    setOpenMobile(false);
  }, [currentHref, setOpenMobile]);

  const teamSettingsContext = isTeamSettingsPath(currentPathname);
  const routeContext = getPortalAppContext(currentHref, teamId);
  const returnToContext = getPortalAppContext(
    currentSearchParams.get("return_to") ?? undefined,
    teamId,
  );
  // Team settings is team-scoped, so it has no [appId] route segment. Its
  // validated return_to preserves the app that launched it, keeping every
  // app-scoped row mounted and usable across the boundary.
  const appId = routeAppId ?? routeContext?.appId ?? returnToContext?.appId;
  const ids = teamId && appId ? { team_id: teamId, app_id: appId } : undefined;
  const appBase = ids ? urls.app(ids) : undefined;
  const teamOverviewHref = teamId ? urls.teams({ team_id: teamId }) : undefined;

  const committedQuery = committedSearchParams.toString();
  const committedHref = `${pathname}${committedQuery ? `?${committedQuery}` : ""}`;
  const settingsReturnTo = teamSettingsContext
    ? getPortalReturnTo(currentSearchParams.get("return_to") ?? undefined) ??
      undefined
    : ids
      ? committedHref
      : undefined;

  const withinApp = (prefix: string) => {
    if (!appBase || !currentPathname.startsWith(appBase)) return false;
    const relativePath = currentPathname.slice(appBase.length);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  };

  const worldIdHref = ids ? urls.worldId(ids) : undefined;
  const onCanonicalWorldId = Boolean(
    appBase &&
      worldIdHref &&
      (currentPathname === appBase || currentPathname === worldIdHref),
  );
  const onWorldIdConfigurationRoute = withinApp("/world-id-4-0");
  const onWorldIdActionsRoute = withinApp("/world-id-actions");
  const onLegacyActionsRoute =
    withinApp("/actions") || withinApp("/world-id/legacy-actions");

  const { data: worldIdNavigationData } = useQuery(
    GetWorldIdNavigationDocument,
    {
      variables: { app_id: appId ?? "" },
      skip: !appId || !onCanonicalWorldId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
  );
  const worldIdApp = worldIdNavigationData?.app?.[0];
  const rp = worldIdApp?.rp_registration?.[0];
  const hasResolvedApp = worldIdApp?.id === appId;
  const hasRpRegistration = hasResolvedApp && Boolean(rp);
  const hasActiveRp =
    hasRpRegistration && rp?.status === RpRegistrationStatus.Registered;
  const hasLegacyActions =
    hasResolvedApp && (worldIdNavigationData?.action?.length ?? 0) > 0;
  const requestedWorldIdTab = normalizeWorldIdTab(
    currentSearchParams.get("tab"),
  );
  const activeWorldIdTab = hasResolvedApp
    ? resolveActiveWorldIdTab({
        requestedTab: requestedWorldIdTab,
        hasRpRegistration,
        hasActiveRp,
        hasLegacyActions,
        enableRequested: currentSearchParams.get("enableWorldId4") === "true",
        createRequested: currentSearchParams.get("createAction") === "true",
      })
    : requestedWorldIdTab ?? WORLD_ID_TABS.Actions;

  const worldIdConfigurationActive =
    onWorldIdConfigurationRoute ||
    (onCanonicalWorldId && activeWorldIdTab === WORLD_ID_TABS.Configuration);
  const dashboardActive =
    onWorldIdActionsRoute ||
    onLegacyActionsRoute ||
    (onCanonicalWorldId && !worldIdConfigurationActive);
  const analyticsActive = withinApp("/analytics");

  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  useEffect(() => {
    setAnalyticsEnabled(false);
    if (!appId) return;

    let active = true;
    const controller = new AbortController();
    fetch(
      `/api/v2/apps/${encodeURIComponent(appId)}/selfie-check-analytics?table=daily`,
      { credentials: "same-origin", signal: controller.signal },
    )
      .then((response) => {
        if (active) setAnalyticsEnabled(response.ok || response.status === 503);
      })
      .catch(() => {
        if (active) setAnalyticsEnabled(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [appId]);
  const verificationActive = withinApp("/configuration");
  const developActive =
    currentPathname === (appBase ? `${appBase}/mini-app` : "") ||
    withinApp("/mini-app/develop") ||
    withinApp("/mini-app/permissions");
  const transactionsActive =
    withinApp("/mini-app/transactions") || withinApp("/transactions");
  const notificationsActive =
    withinApp("/mini-app/notifications") || withinApp("/notifications");
  const canViewApiKeys = Boolean(
    teamId && props.apiKeyTeamIds?.includes(teamId),
  );
  const activeTeamSettingsTab = resolveTeamSettingsTab(
    currentSearchParams.get("tab") ?? undefined,
    canViewApiKeys,
  );

  const teamSettingsItems = teamId
    ? [
        {
          label: "General",
          value: TEAM_SETTINGS_TABS.General,
          href: urls.teamSettings({
            team_id: teamId,
            return_to: settingsReturnTo,
          }),
          icon: <SidebarGlyph name="nav-settings-active" />,
        },
        {
          label: "Members",
          value: TEAM_SETTINGS_TABS.Members,
          href: urls.teamSettings({
            team_id: teamId,
            return_to: settingsReturnTo,
            tab: TEAM_SETTINGS_TABS.Members,
          }),
          icon: <SidebarGlyph name="nav-group" />,
        },
        ...(canViewApiKeys
          ? [
              {
                label: "API Keys",
                value: TEAM_SETTINGS_TABS.ApiKeys,
                href: urls.teamSettings({
                  team_id: teamId,
                  return_to: settingsReturnTo,
                  tab: TEAM_SETTINGS_TABS.ApiKeys,
                }),
                icon: (
                  <SidebarGlyph
                    name="nav-key"
                    className="h-[11.6731px] w-[13.4283px]"
                  />
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <nav
      aria-label="Primary navigation"
      className="relative flex min-h-0 flex-1 flex-col px-2 pt-4 pb-2.5"
    >
      <NavActivePill
        key={`${teamId ?? "none"}:${appId ?? "team"}`}
        animate={
          !(
            optimisticHref &&
            routeAppId &&
            currentPathname === teamOverviewHref
          )
        }
      />

      <div className="flex flex-col gap-4">
        {teamOverviewHref ? (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <NavItem
                  label="Projects"
                  href={teamOverviewHref}
                  active={
                    currentPathname === teamOverviewHref ||
                    currentPathname === `${teamOverviewHref}/apps`
                  }
                  onNavigate={beginNavigation(teamOverviewHref)}
                  icon={<SidebarGlyph name="view-grid-active" />}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {ids ? (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <NavItem
                  label="Dashboard"
                  href={urls.worldIdTab({
                    ...ids,
                    tab: WORLD_ID_TABS.Actions,
                  })}
                  active={dashboardActive}
                  onNavigate={beginNavigation(
                    urls.worldIdTab({
                      ...ids,
                      tab: WORLD_ID_TABS.Actions,
                    }),
                  )}
                  icon={<SidebarGlyph name="nav-home-active" />}
                />
                {analyticsEnabled && appBase ? (
                  <NavItem
                    label="Analytics"
                    href={`${appBase}/analytics`}
                    active={analyticsActive}
                    onNavigate={beginNavigation(`${appBase}/analytics`)}
                    icon={<SidebarGlyph name="stat-triangle" />}
                  />
                ) : null}
                <NavItem
                  label="World ID Configuration"
                  href={urls.worldIdTab({
                    ...ids,
                    tab: WORLD_ID_TABS.Configuration,
                  })}
                  active={worldIdConfigurationActive}
                  onNavigate={beginNavigation(
                    urls.worldIdTab({
                      ...ids,
                      tab: WORLD_ID_TABS.Configuration,
                    }),
                  )}
                  icon={<SidebarGlyph name="nav-credential" />}
                />
                <NavItem
                  label="Verification"
                  href={urls.configuration(ids)}
                  active={verificationActive}
                  onNavigate={beginNavigation(urls.configuration(ids))}
                  icon={<SidebarGlyph name="nav-badge-check" />}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {ids ? (
          <SidebarGroup className="gap-1 p-0">
            <SectionLabel>Mini App</SectionLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <NavItem
                  label="Develop"
                  href={urls.miniAppDevelop(ids)}
                  active={developActive}
                  onNavigate={beginNavigation(urls.miniAppDevelop(ids))}
                  icon={<SidebarGlyph name="nav-delivery-check" />}
                />
                <NavItem
                  label="Transactions"
                  href={urls.miniAppTransactions(ids)}
                  active={transactionsActive}
                  onNavigate={beginNavigation(urls.miniAppTransactions(ids))}
                  icon={<SidebarGlyph name="nav-arrows-transfer" />}
                />
                <NavItem
                  label="Notifications"
                  href={urls.miniAppNotifications(ids)}
                  active={notificationsActive}
                  onNavigate={beginNavigation(urls.miniAppNotifications(ids))}
                  icon={<SidebarGlyph name="nav-bell" />}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {teamId ? (
          <SidebarGroup className="gap-1 p-0">
            <SectionLabel>Team settings</SectionLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {teamSettingsItems.map((item) => (
                  <NavItem
                    key={item.value}
                    label={item.label}
                    href={item.href}
                    active={
                      teamSettingsContext &&
                      activeTeamSettingsTab === item.value
                    }
                    onNavigate={beginNavigation(item.href)}
                    icon={item.icon}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </div>

      {!ids && !teamId ? (
        <div className="mt-auto pt-3 group-data-[collapsible=icon]:hidden">
          <SandboxButton
            className="-ml-1 w-[calc(100%_+_8px)]"
            initialRequest={props.initialSandboxRequest}
          />
        </div>
      ) : null}

      {teamId ? (
        <div className="mt-auto px-4 pt-3 pb-3 group-data-[collapsible=icon]:hidden">
          <SandboxButton
            className="-ml-1 w-[calc(100%_+_8px)]"
            teamId={teamId}
            initialRequest={props.initialSandboxRequest}
          />
        </div>
      ) : null}
    </nav>
  );
};
