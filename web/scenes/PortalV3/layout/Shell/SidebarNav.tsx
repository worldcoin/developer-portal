"use client";

import { DOCS_URL } from "@/lib/constants";
import { urls } from "@/lib/urls";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCurrentAppId } from "./AppsDropdown";
import { NavItem } from "./NavItem";

type AppEnvFlags = {
  appId: string;
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
};

const appEnvFlagsAtom = atom<AppEnvFlags | undefined>(undefined);

/**
 * Rendered by the (server) v3 AppIdLayout to publish app-env flags to the
 * sidebar. Renders nothing.
 */
export const AppEnvFlagsSync = (props: AppEnvFlags) => {
  const { appId, hasRpRegistration, hasLegacyActions } = props;
  const setFlags = useSetAtom(appEnvFlagsAtom);

  useEffect(() => {
    setFlags({ appId, hasRpRegistration, hasLegacyActions });
  }, [appId, hasRpRegistration, hasLegacyActions, setFlags]);

  return null;
};

// Nav icons ship as `<name>.svg` (inactive) + `<name>-active.svg` (active).
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
  const appEnvFlags = useAtomValue(appEnvFlagsAtom);

  // Team-less pages (e.g. /profile) carry no teamId in the URL, so team-scoped
  // links can't be built directly. Rather than pick a team here, fall back to
  // the /teams landing route, which resolves the user's team server-side — the
  // same way login does (and it also handles the no-teams / broken-session
  // cases). urls.teams({}) === "/teams".
  const teamsLandingHref = urls.teams({});

  const appsListHref = teamId
    ? urls.apps({ team_id: teamId })
    : teamsLandingHref;
  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  const appHref = appBase ?? appsListHref;
  const ids = teamId && appId ? { team_id: teamId, app_id: appId } : undefined;
  const flags = appEnvFlags?.appId === appId ? appEnvFlags : undefined;

  const worldIdHref = (() => {
    if (!ids) return appsListHref;
    if (flags?.hasRpRegistration) return urls.worldId40(ids);
    if (flags?.hasLegacyActions) return urls.actions(ids);
    return urls.worldId40(ids);
  })();

  const configurationHref = ids ? urls.configuration(ids) : appsListHref;
  const miniAppHref = appBase ? `${appBase}/mini-app` : appsListHref;
  const notificationsHref = ids ? urls.miniAppNotifications(ids) : appsListHref;
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

  const dashboardActive =
    pathname === appsListHref || (Boolean(appBase) && pathname === appBase);
  const worldIdActive =
    withinApp("/world-id-4-0") ||
    withinApp("/world-id-actions") ||
    withinApp("/actions");
  const configurationActive = withinApp("/configuration");
  const miniAppActive =
    withinApp("/mini-app") ||
    withinApp("/transactions") ||
    withinApp("/notifications");
  const notificationsActive =
    withinApp("/mini-app/notifications") || withinApp("/notifications");
  const settingsActive = teamId ? pathname.startsWith(teamSettingsHref) : false;

  return (
    <nav className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 pt-[27px]">
      <div className="grid gap-2">
        <NavItem
          label="Dashboard"
          href={appHref}
          active={dashboardActive}
          icon={<NavIcon name="nav-home" active={dashboardActive} />}
        />

        {appId ? (
          <>
            <NavItem
              label="World ID"
              href={worldIdHref}
              active={worldIdActive}
              icon={<NavIcon name="nav-world-id" active={worldIdActive} />}
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
              active={miniAppActive && !notificationsActive}
              icon={
                <NavIcon
                  name="nav-mini-app"
                  active={miniAppActive && !notificationsActive}
                />
              }
            />
          </>
        ) : null}

        <NavItem
          label="Notifications"
          href={notificationsHref}
          active={notificationsActive}
          icon={<NavIcon name="nav-bell" active={notificationsActive} />}
        />
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
        <NavItem
          label="Help center"
          href={DOCS_URL}
          icon={<Icon name="nav-help" className="size-4" />}
        />
      </div>
    </nav>
  );
};
