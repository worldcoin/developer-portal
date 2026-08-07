"use client";

import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  getPortalReturnTo,
  isTeamSettingsPath,
  resolvePortalReturnTo,
  resolveTeamSettingsTab,
  TEAM_SETTINGS_TABS,
} from "@/lib/team-settings";
import { urls } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { Icon, preloadIcons } from "@/scenes/PortalV3/common/Icon";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  BellIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  Settings2Icon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
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
import { WorldIdNavItems } from "./WorldIdNavItems";

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
 * Owns the optimistic tab-navigation state. Mounted once in PortalShell so the
 * sidebar (sliding pill) and the content column (loading overlay) read the
 * same in-flight navigation instead of each guessing from the router. No
 * clearing effect needed: when the transition ends, consumers fall back to the
 * real pathname, which either confirms or reverts the pending target.
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

// Both variants stay mounted so the active swap is a crossfade in sync with
// the sliding pill (and the active asset is fetched before first activation).
const NavIcon = (props: { name: string; active?: boolean }) => (
  <span className="grid size-4 shrink-0">
    <Icon
      name={props.name}
      className={cn(
        "col-start-1 row-start-1 size-4 transition-opacity duration-200 ease-out",
        props.active && "opacity-0",
      )}
    />
    <Icon
      name={`${props.name}-active`}
      className={cn(
        "col-start-1 row-start-1 size-4 transition-opacity duration-200 ease-out",
        !props.active && "opacity-0",
      )}
    />
  </span>
);

/**
 * Static `/images/portal-v3/icons` assets used by the sidebar. NavIcon rows
 * mount idle+active together, so warm the full set with the nav itself.
 */
const sidebarPreloadIcons = [
  // Top-level rows (idle + active)
  "nav-mini-app",
  "nav-mini-app-active",
  "nav-home",
  "nav-home-active",
  "nav-settings",
  "nav-settings-active",
  // World ID configuration row
  "nav-configuration",
  // Sandbox CTA
  "world-id-sandbox-app-icon",
] as const;

export const SidebarNav = (props: {
  initialSandboxRequest?: SandboxAccessRequestState | null;
  apiKeyTeamIds?: string[];
}) => {
  preloadIcons(sidebarPreloadIcons);

  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const committedSearchParams = useSearchParams();
  const teamId = params?.teamId;
  const appId = params?.appId;
  const { setOpenMobile } = useSidebar();

  // Optimistic route: while a clicked navigation is in flight, the target href
  // drives the active styles so the pill slides immediately instead of waiting
  // for the route to settle. No cleanup needed — once the transition ends,
  // `currentHref` falls back to the real pathname, which either confirms the
  // pending target (navigation committed) or reverts it (navigation failed).
  const { pendingHref, isNavigating, navigate } = useShellNavigation();
  const pendingTargetHref =
    isNavigating && pendingHref !== null ? pendingHref : null;
  const isSettingsHref = (href: string) =>
    isTeamSettingsPath(href.split(/[?#]/, 1)[0]);
  // App-tab changes keep the immediate pill slide, as do switches between
  // settings sections. Crossing into or out of settings replaces the entire
  // sidebar, so wait for the route commit and swap both page and nav once.
  const optimisticHref =
    pendingTargetHref !== null &&
    isSettingsHref(pendingTargetHref) === isSettingsHref(pathname)
      ? pendingTargetHref
      : null;
  const currentHref = optimisticHref ?? pathname;
  // Sidebar destinations may use query-backed sections. Route ownership and
  // active parent checks must compare only the pathname portion.
  const currentPathname = currentHref.split(/[?#]/, 1)[0];
  const currentSearchParams = optimisticHref
    ? new URLSearchParams(optimisticHref.split("?", 2)[1] ?? "")
    : committedSearchParams;

  const beginNavigation =
    (href: string): MouseEventHandler<HTMLAnchorElement> =>
    (event) => {
      // Fall through to the Link default for new-tab/window modifier clicks.
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

  // Close the mobile sheet when the route changes — but only on a CHANGE. On
  // mobile this component mounts inside the sheet itself, so running the
  // close on mount would instantly shut the sidebar the trigger just opened.
  const previousHrefRef = useRef(currentHref);
  useEffect(() => {
    if (previousHrefRef.current === currentHref) return;
    previousHrefRef.current = currentHref;
    setOpenMobile(false);
  }, [currentHref, setOpenMobile]);

  const teamsLandingHref = urls.teams({});
  const teamOverviewHref = teamId
    ? urls.teams({ team_id: teamId })
    : teamsLandingHref;
  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;
  const ids = teamId && appId ? { team_id: teamId, app_id: appId } : undefined;

  const configurationHref = ids ? urls.configuration(ids) : teamOverviewHref;
  const miniAppHref = ids ? urls.miniAppDevelop(ids) : teamOverviewHref;
  const miniAppTransactionsHref = ids
    ? urls.miniAppTransactions(ids)
    : teamOverviewHref;
  const miniAppNotificationsHref = ids
    ? urls.miniAppNotifications(ids)
    : teamOverviewHref;
  const teamSettingsBase = teamId
    ? urls.teamSettings({ team_id: teamId })
    : teamsLandingHref;
  const committedQuery = committedSearchParams.toString();
  const returnTo = `${pathname}${committedQuery ? `?${committedQuery}` : ""}`;
  const teamSettingsHref = teamId
    ? urls.teamSettings({ team_id: teamId, return_to: returnTo })
    : teamsLandingHref;

  const withinApp = (prefix: string) => {
    if (!appId || !teamId) return false;
    const routeBase = urls.app({ team_id: teamId, app_id: appId });
    if (!currentPathname.startsWith(routeBase)) return false;
    const relativePath = currentPathname.slice(routeBase.length);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  };

  const configurationActive = withinApp("/configuration");
  const settingsActive = teamId ? currentPathname === teamSettingsBase : false;
  const teamSettingsContext = isTeamSettingsPath(currentPathname);
  const canViewApiKeys = Boolean(
    teamId && props.apiKeyTeamIds?.includes(teamId),
  );
  const activeTeamSettingsTab = resolveTeamSettingsTab(
    currentSearchParams.get("tab") ?? undefined,
    canViewApiKeys,
  );
  const settingsReturnTo =
    getPortalReturnTo(currentSearchParams.get("return_to") ?? undefined) ??
    undefined;
  const goBackHref = resolvePortalReturnTo(
    currentSearchParams.get("return_to") ?? undefined,
  );
  const teamSettingsItems = teamId
    ? [
        {
          label: "Team Name",
          value: TEAM_SETTINGS_TABS.General,
          href: urls.teamSettings({
            team_id: teamId,
            return_to: settingsReturnTo,
          }),
          icon: <Settings2Icon strokeWidth={1.5} className="size-4" />,
        },
        {
          label: "Members",
          value: TEAM_SETTINGS_TABS.Members,
          href: urls.teamSettings({
            team_id: teamId,
            return_to: settingsReturnTo,
            tab: TEAM_SETTINGS_TABS.Members,
          }),
          icon: <UsersIcon strokeWidth={1.5} className="size-4" />,
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
                icon: <KeyRoundIcon strokeWidth={1.5} className="size-4" />,
              },
            ]
          : []),
      ]
    : [];
  const miniAppDevelopActive =
    currentPathname === (appBase ? `${appBase}/mini-app` : "") ||
    withinApp("/mini-app/develop") ||
    withinApp("/mini-app/permissions");
  const miniAppTransactionsActive =
    withinApp("/mini-app/transactions") || withinApp("/transactions");
  const miniAppNotificationsActive =
    withinApp("/mini-app/notifications") || withinApp("/notifications");
  // The nav renders different item sets for app vs team routes. Remount the
  // pill when that context changes so it snaps to the new hierarchy instead
  // of sliding through rows that are mounting or unmounting.
  const pathContext = /\/apps\/[^/]+/.test(currentPathname) ? "app" : "team";
  const paramsContext = appId ? "app" : "team";
  const pillContextKey = `${teamId ?? "none"}:${paramsContext}:${pathContext}`;

  if (teamSettingsContext) {
    return (
      <nav
        aria-label="Team settings navigation"
        className="relative flex min-h-0 flex-1 flex-col"
      >
        <NavActivePill key={`${pillContextKey}:settings`} />
        <SidebarGroup className="px-4 py-2 group-data-[collapsible=icon]:px-3">
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                label="Settings"
                href={goBackHref}
                onNavigate={beginNavigation(goBackHref)}
                icon={<ArrowLeftIcon strokeWidth={1.5} className="size-4" />}
                className="relative justify-center font-medium text-portal-text [&>span:first-child]:absolute [&>span:first-child]:left-3"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-4 pt-2 pb-2 group-data-[collapsible=icon]:px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {teamSettingsItems.map((item) => (
                <NavItem
                  key={item.value}
                  label={item.label}
                  href={item.href}
                  active={activeTeamSettingsTab === item.value}
                  onNavigate={beginNavigation(item.href)}
                  icon={item.icon}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-4 pt-3 pb-3 group-data-[collapsible=icon]:hidden">
          <SandboxButton
            className="-ml-1 w-[calc(100%_+_8px)]"
            initialRequest={props.initialSandboxRequest}
          />
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <NavActivePill key={pillContextKey} />
      {teamId ? (
        <>
          <SidebarGroup className="px-4 py-2 group-data-[collapsible=icon]:px-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {appId ? (
                  <>
                    <WorldIdNavItems
                      teamId={teamId}
                      appId={appId}
                      currentPathname={currentPathname}
                      optimisticHref={optimisticHref}
                      getNavigationHandler={beginNavigation}
                    />
                    <NavItem
                      label="Get verified"
                      href={configurationHref}
                      active={configurationActive}
                      onNavigate={beginNavigation(configurationHref)}
                      icon={
                        <BadgeCheckIcon strokeWidth={1.5} className="size-4" />
                      }
                    />
                    <NavItem
                      label="Mini App"
                      href={miniAppHref}
                      active={miniAppDevelopActive}
                      onNavigate={beginNavigation(miniAppHref)}
                      icon={
                        <NavIcon
                          name="nav-mini-app"
                          active={miniAppDevelopActive}
                        />
                      }
                    />
                    <NavItem
                      label="Transactions"
                      href={miniAppTransactionsHref}
                      active={miniAppTransactionsActive}
                      onNavigate={beginNavigation(miniAppTransactionsHref)}
                      icon={
                        <WalletCardsIcon strokeWidth={1.5} className="size-4" />
                      }
                    />
                    <NavItem
                      label="Notifications"
                      href={miniAppNotificationsHref}
                      active={miniAppNotificationsActive}
                      onNavigate={beginNavigation(miniAppNotificationsHref)}
                      icon={<BellIcon strokeWidth={1.5} className="size-4" />}
                    />
                  </>
                ) : (
                  <NavItem
                    label="Overview"
                    href={teamOverviewHref}
                    active={currentPathname === teamOverviewHref}
                    onNavigate={beginNavigation(teamOverviewHref)}
                    icon={
                      <NavIcon
                        name="nav-home"
                        active={currentPathname === teamOverviewHref}
                      />
                    }
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-4 my-0 bg-portal-border" />
        </>
      ) : null}

      {teamId ? (
        <SidebarGroup className="px-4 pt-3 pb-2 group-data-[collapsible=icon]:px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <NavItem
                label="Team settings"
                href={teamSettingsHref}
                active={settingsActive}
                onNavigate={beginNavigation(teamSettingsHref)}
                icon={<NavIcon name="nav-settings" active={settingsActive} />}
                trailing={
                  <ChevronRightIcon
                    aria-hidden="true"
                    strokeWidth={2}
                    className="size-[18px] text-portal-text"
                  />
                }
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      <div className="mt-auto px-4 pt-3 pb-3 group-data-[collapsible=icon]:hidden">
        <SandboxButton
          className="-ml-1 w-[calc(100%_+_8px)]"
          initialRequest={props.initialSandboxRequest}
        />
      </div>
    </nav>
  );
};
