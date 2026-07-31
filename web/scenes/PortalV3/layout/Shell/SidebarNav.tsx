"use client";

import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { BellIcon, LockKeyholeIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  createContext,
  MouseEventHandler,
  ReactNode,
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

export const SidebarNav = (props: {
  initialSandboxRequest?: SandboxAccessRequestState | null;
}) => {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;
  const { setOpenMobile } = useSidebar();

  // Optimistic route: while a clicked navigation is in flight, the target href
  // drives the active styles so the pill slides immediately instead of waiting
  // for the route to settle. No cleanup needed — once the transition ends,
  // `currentPath` falls back to the real pathname, which either confirms the
  // pending target (navigation committed) or reverts it (navigation failed).
  const { pendingHref, isNavigating, navigate } = useShellNavigation();
  const currentPath =
    isNavigating && pendingHref !== null ? pendingHref : pathname;

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
  const previousPathRef = useRef(currentPath);
  useEffect(() => {
    if (previousPathRef.current === currentPath) return;
    previousPathRef.current = currentPath;
    setOpenMobile(false);
  }, [currentPath, setOpenMobile]);

  const teamsLandingHref = urls.teams({});
  const teamOverviewHref = teamId
    ? urls.teams({ team_id: teamId })
    : teamsLandingHref;
  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;
  const ids = teamId && appId ? { team_id: teamId, app_id: appId } : undefined;

  const worldIdHref = ids ? urls.worldId40(ids) : teamOverviewHref;
  const configurationHref = ids ? urls.configuration(ids) : teamOverviewHref;
  const miniAppHref = ids ? urls.miniAppPermissions(ids) : teamOverviewHref;
  const teamSettingsHref = teamId
    ? urls.teamSettings({ team_id: teamId })
    : teamsLandingHref;

  const withinApp = (prefix: string) => {
    if (!appId || !teamId) return false;
    const routeBase = urls.app({ team_id: teamId, app_id: appId });
    if (!currentPath.startsWith(routeBase)) return false;
    const relativePath = currentPath.slice(routeBase.length);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  };

  const worldIdActive =
    (Boolean(appBase) && currentPath === appBase) ||
    withinApp("/world-id-4-0") ||
    withinApp("/world-id-actions") ||
    withinApp("/actions");
  const configurationActive = withinApp("/configuration");
  const miniAppActive =
    withinApp("/mini-app") ||
    withinApp("/transactions") ||
    withinApp("/notifications");
  const currentSearch = searchParams.toString();
  const currentPath = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
  const settingsActive = teamId ? pathname.startsWith(teamSettingsHref) : false;
  const teamSettingsNavigationHref = teamId
    ? settingsActive
      ? teamSettingsHref
      : getTeamSettingsHref({ teamId, returnTo: currentPath })
    : teamsLandingHref;
  const settingsActive = teamId
    ? currentPath.startsWith(teamSettingsHref)
    : false;
  const miniAppPermissionsActive =
    currentPath === (appBase ? `${appBase}/mini-app` : "") ||
    withinApp("/mini-app/permissions");
  const miniAppTransactionsActive =
    withinApp("/mini-app/transactions") || withinApp("/transactions");
  const miniAppNotificationsActive =
    withinApp("/mini-app/notifications") || withinApp("/notifications");
  const miniAppItems = ids
    ? [
        {
          label: "Permissions",
          href: urls.miniAppPermissions(ids),
          active: miniAppPermissionsActive,
          icon: (
            <LockKeyholeIcon
              strokeWidth={1.5}
              className={`${opticalIconClassName} size-4`}
            />
          ),
        },
        {
          label: "Transactions",
          href: urls.miniAppTransactions(ids),
          active: miniAppTransactionsActive,
          icon: (
            <WalletCardsIcon
              strokeWidth={1.5}
              className={`${opticalIconClassName} size-4`}
            />
          ),
        },
        {
          label: "Notifications",
          href: urls.miniAppNotifications(ids),
          active: miniAppNotificationsActive,
          icon: (
            <BellIcon
              strokeWidth={1.5}
              className={`${opticalIconClassName} size-4`}
            />
          ),
        },
      ]
    : [];

  // The nav renders different item sets for app vs team routes, so when a
  // navigation crosses that boundary (e.g. Configuration → Team settings) the
  // items above the target mount/unmount and every position shifts twice:
  // once optimistically at click, once when the params commit. Sliding
  // through that reads as a down-then-up stutter — instead, a context change
  // remounts the pill (key below), which re-places itself instantly via its
  // unanimated first paint. Both the optimistic target's context and the
  // rendered params' context are in the key so each of the two shifts snaps.
  const pathContext = /\/apps\/[^/]+/.test(currentPath) ? "app" : "team";
  const paramsContext = appId ? "app" : "team";
  const pillContextKey = `${teamId ?? "none"}:${paramsContext}:${pathContext}`;

  return (
    <nav
      aria-label="Primary navigation"
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <NavActivePill key={pillContextKey} />
      {teamId && !settingsActive ? (
        <>
          <SidebarGroup className="px-4 py-2 group-data-[collapsible=icon]:px-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {appId ? (
                  <>
                    <NavItem
                      label="World ID"
                      href={worldIdHref}
                      active={worldIdActive}
                      onNavigate={beginNavigation(worldIdHref)}
                      icon={
                        <NavIcon name="nav-world-id" active={worldIdActive} />
                      }
                    />
                    <NavItem
                      label="Configuration"
                      href={configurationHref}
                      active={configurationActive}
                      onNavigate={beginNavigation(configurationHref)}
                      icon={
                        <NavIcon
                          name="nav-configuration"
                          active={configurationActive}
                        />
                      }
                    />
                    <NavItem
                      label="Mini App"
                      href={miniAppHref}
                      active={miniAppActive}
                      current={false}
                      onNavigate={beginNavigation(miniAppHref)}
                      icon={
                        <NavIcon name="nav-mini-app" active={miniAppActive} />
                      }
                    >
                      {miniAppActive ? (
                        <SidebarMenuSub
                          aria-label="Mini App navigation"
                          className="mt-2 mr-0 ml-5 border-portal-border pr-0 pl-2.5"
                        >
                          {miniAppItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                asChild
                                size="sm"
                                isActive={item.active}
                                className="h-9 cursor-pointer px-3 font-world text-portal-muted hover:bg-portal-border hover:text-portal-text data-[active=true]:bg-white data-[active=true]:text-portal-text [&>svg]:text-current"
                              >
                                <Link
                                  href={item.href}
                                  onClick={beginNavigation(item.href)}
                                  aria-current={
                                    item.active ? "page" : undefined
                                  }
                                >
                                  {item.icon}
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </NavItem>
                  </>
                ) : (
                  <NavItem
                    label="Overview"
                    href={teamOverviewHref}
                    active={currentPath === teamOverviewHref}
                    onNavigate={beginNavigation(teamOverviewHref)}
                    icon={
                      <NavIcon
                        name="nav-home"
                        active={currentPath === teamOverviewHref}
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
                href={teamSettingsNavigationHref}
                active={settingsActive}
                onNavigate={beginNavigation(teamSettingsHref)}
                icon={<NavIcon name="nav-settings" active={settingsActive} />}
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
