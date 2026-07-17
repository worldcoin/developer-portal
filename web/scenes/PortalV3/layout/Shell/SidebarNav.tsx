"use client";

import { LockIcon } from "@/components/Icons/LockIcon";
import { SendIcon } from "@/components/Icons/SendIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { urls } from "@/lib/urls";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { useParams, usePathname } from "next/navigation";
import { useCurrentAppId } from "./AppsDropdown";
import { HelpCenterMenu } from "./HelpCenterMenu";
import { NavItem } from "./NavItem";

const NavIcon = (props: { name: string; active?: boolean }) => (
  <Icon
    name={props.active ? `${props.name}-active` : props.name}
    className="size-4"
  />
);

export const SidebarNav = () => {
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const routeAppId = params?.appId;
  const appId = useCurrentAppId();

  const teamsLandingHref = urls.teams({});

  const appsListHref = teamId
    ? urls.apps({ team_id: teamId })
    : teamsLandingHref;
  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  const ids = teamId && appId ? { team_id: teamId, app_id: appId } : undefined;

  const worldIdHref = ids ? urls.worldId40(ids) : appsListHref;

  const configurationHref = ids ? urls.configuration(ids) : appsListHref;
  const miniAppHref = ids ? urls.miniAppPermissions(ids) : appsListHref;
  const teamSettingsHref = teamId
    ? urls.teamSettings({ team_id: teamId })
    : teamsLandingHref;

  const withinApp = (prefix: string) => {
    if (!routeAppId || !teamId) return false;
    const routeBase = urls.app({ team_id: teamId, app_id: routeAppId });
    if (!pathname.startsWith(routeBase)) return false;
    const rel = pathname.slice(routeBase.length);
    return rel === prefix || rel.startsWith(`${prefix}/`);
  };

  const worldIdActive =
    pathname === appsListHref ||
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
  const miniAppPermissionsActive =
    pathname === (appBase ? `${appBase}/mini-app` : "") ||
    withinApp("/mini-app/permissions");
  const miniAppTransactionsActive =
    withinApp("/mini-app/transactions") || withinApp("/transactions");
  const miniAppNotificationsActive =
    withinApp("/mini-app/notifications") || withinApp("/notifications");

  return (
    <nav className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 pt-[27px]">
      <div className="grid gap-2">
        <NavItem
          label="World ID"
          href={worldIdHref}
          active={worldIdActive}
          icon={<NavIcon name="nav-world-id" active={worldIdActive} />}
        />

        {appId ? (
          <>
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
              icon={<NavIcon name="nav-mini-app" active={miniAppActive} />}
            />
            {miniAppActive && ids ? (
              <div className="ml-5 grid gap-1 border-l border-portal-border pl-2">
                <NavItem
                  label="Permissions"
                  href={urls.miniAppPermissions(ids)}
                  active={miniAppPermissionsActive}
                  className="h-9 rounded-8 pr-3 pl-3 text-12"
                  icon={<LockIcon className="size-3.5" />}
                />
                <NavItem
                  label="Transactions"
                  href={urls.miniAppTransactions(ids)}
                  active={miniAppTransactionsActive}
                  className="h-9 rounded-8 pr-3 pl-3 text-12"
                  icon={<WalletIcon className="size-3.5" />}
                />
                <NavItem
                  label="Notifications"
                  href={urls.miniAppNotifications(ids)}
                  active={miniAppNotificationsActive}
                  className="h-9 rounded-8 pr-3 pl-3 text-12"
                  icon={<SendIcon className="size-3.5" />}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="my-2 h-px w-full">
        <Icon name="nav-separator" className="h-px w-full" />
      </div>

      <div className="grid gap-2">
        <NavItem
          label="Team settings"
          href={teamSettingsHref}
          active={settingsActive}
          icon={<NavIcon name="nav-settings" active={settingsActive} />}
        />
        <HelpCenterMenu />
      </div>
    </nav>
  );
};
