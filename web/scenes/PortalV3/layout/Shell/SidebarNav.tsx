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
import { getTeamSettingsHref } from "@/lib/team-settings-return-to";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { BellIcon, LockKeyholeIcon, WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { NavItem } from "./NavItem";
import { SandboxButton } from "./SandboxButton";

const NavIcon = (props: { name: string; active?: boolean }) => (
  <Icon
    name={props.active ? `${props.name}-active` : props.name}
    className="size-4"
  />
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

  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

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
    if (!pathname.startsWith(routeBase)) return false;
    const relativePath = pathname.slice(routeBase.length);
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`);
  };

  const worldIdActive =
    (Boolean(appBase) && pathname === appBase) ||
    withinApp("/world-id-4-0") ||
    withinApp("/world-id-actions") ||
    withinApp("/actions");
  const configurationActive = withinApp("/configuration");
  const miniAppActive =
    withinApp("/mini-app") ||
    withinApp("/transactions") ||
    withinApp("/notifications");
  const settingsActive = teamId ? pathname.startsWith(teamSettingsHref) : false;
  const currentSearch = searchParams.toString();
  const currentPath = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
  const teamSettingsNavigationHref = teamId
    ? settingsActive
      ? teamSettingsHref
      : getTeamSettingsHref({ teamId, returnTo: currentPath })
    : teamsLandingHref;
  const miniAppPermissionsActive =
    pathname === (appBase ? `${appBase}/mini-app` : "") ||
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

  return (
    <nav
      aria-label="Primary navigation"
      className="flex min-h-0 flex-1 flex-col"
    >
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
                      icon={
                        <NavIcon name="nav-world-id" active={worldIdActive} />
                      }
                    />
                    <NavItem
                      label="Configuration"
                      href={configurationHref}
                      active={configurationActive}
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
                                  prefetch={false}
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
                    active={pathname === teamOverviewHref}
                    icon={
                      <NavIcon
                        name="nav-home"
                        active={pathname === teamOverviewHref}
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
