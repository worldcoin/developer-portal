import { urls } from "@/lib/urls";

export type AppEnvironmentFlags = {
  appId: string;
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
};

export type SidebarNavigationItem = {
  label: string;
  href: string;
  active: boolean;
  dimmed?: boolean;
};

type SectionSidebarNavigation = {
  kind: "section";
  label: string;
  backHref: string;
  items: SidebarNavigationItem[];
};

type MainSidebarNavigation = {
  kind: "main";
  appItems: SidebarNavigationItem[];
  teamItems: SidebarNavigationItem[];
};

export type SidebarNavigation =
  | SectionSidebarNavigation
  | MainSidebarNavigation;

type BuildSidebarNavigationParams = {
  pathname: string;
  teamId?: string;
  routeAppId?: string;
  selectedAppId?: string;
  appEnvironmentFlags?: AppEnvironmentFlags;
  canSeeApiKeys: boolean;
  canSeeSettings: boolean;
};

type AppIds = { team_id: string; app_id: string };

const MINI_APP_SECTION_ROOTS = [
  "/mini-app",
  "/transactions",
  "/notifications",
] as const;
const WORLD_ID_SECTION_ROOTS = [
  "/world-id-4-0",
  "/world-id-actions",
  "/actions",
] as const;

const isSameRouteOrDescendant = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const isWithinAppPath = (
  pathname: string,
  appBase: string,
  relativePath: string,
) => isSameRouteOrDescendant(pathname, `${appBase}${relativePath}`);

const isWithinAnyAppPath = (
  pathname: string,
  appBase: string,
  relativePaths: readonly string[],
) =>
  relativePaths.some((relativePath) =>
    isWithinAppPath(pathname, appBase, relativePath),
  );

const matchingFlags = (
  appId: string,
  flags: AppEnvironmentFlags | undefined,
) => (flags?.appId === appId ? flags : undefined);

const buildSectionNavigation = ({
  pathname,
  teamId,
  routeAppId,
  appEnvironmentFlags,
}: Pick<
  BuildSidebarNavigationParams,
  "pathname" | "teamId" | "routeAppId" | "appEnvironmentFlags"
>): SectionSidebarNavigation | undefined => {
  if (!teamId || !routeAppId) return undefined;

  const ids: AppIds = { team_id: teamId, app_id: routeAppId };
  const appBase = urls.app(ids);
  if (!isSameRouteOrDescendant(pathname, appBase)) return undefined;

  const within = (relativePath: string) =>
    isWithinAppPath(pathname, appBase, relativePath);

  if (isWithinAnyAppPath(pathname, appBase, MINI_APP_SECTION_ROOTS)) {
    return {
      kind: "section",
      label: "Mini App",
      backHref: appBase,
      items: [
        {
          label: "Permissions",
          href: urls.miniAppPermissions(ids),
          active: within("/mini-app/permissions"),
        },
        {
          label: "Transactions",
          href: urls.miniAppTransactions(ids),
          active: within("/mini-app/transactions") || within("/transactions"),
        },
        {
          label: "Notifications",
          href: urls.miniAppNotifications(ids),
          active: within("/mini-app/notifications") || within("/notifications"),
        },
      ],
    };
  }

  if (!isWithinAnyAppPath(pathname, appBase, WORLD_ID_SECTION_ROOTS)) {
    return undefined;
  }

  const flags = matchingFlags(routeAppId, appEnvironmentFlags);
  const items: SidebarNavigationItem[] = [
    ...(flags?.hasRpRegistration
      ? [
          {
            label: "World ID 4.0",
            href: urls.worldId40(ids),
            active: within("/world-id-4-0"),
          },
          {
            label: "Actions",
            href: urls.worldIdActions(ids),
            active: within("/world-id-actions"),
          },
        ]
      : []),
    ...(flags?.hasLegacyActions
      ? [
          {
            label: "World ID 3.0 Legacy",
            href: urls.actions(ids),
            active: within("/actions"),
          },
        ]
      : []),
  ];

  return items.length > 0
    ? { kind: "section", label: "World ID", backHref: appBase, items }
    : undefined;
};

const resolveWorldIdHref = (
  ids: AppIds | undefined,
  flags: AppEnvironmentFlags | undefined,
  fallback: string,
) => {
  if (!ids) return fallback;

  const appFlags = matchingFlags(ids.app_id, flags);
  const usesLegacyActions =
    appFlags?.hasLegacyActions && !appFlags.hasRpRegistration;

  return usesLegacyActions ? urls.actions(ids) : urls.worldId40(ids);
};

const buildMainNavigation = ({
  pathname,
  teamId,
  selectedAppId,
  appEnvironmentFlags,
  canSeeApiKeys,
  canSeeSettings,
}: Omit<BuildSidebarNavigationParams, "routeAppId">): MainSidebarNavigation => {
  if (!teamId) return { kind: "main", appItems: [], teamItems: [] };

  const appsListHref = urls.apps({ team_id: teamId });
  const selectedAppIds: AppIds | undefined = selectedAppId
    ? { team_id: teamId, app_id: selectedAppId }
    : undefined;
  const selectedAppBase = selectedAppIds ? urls.app(selectedAppIds) : undefined;

  const appItems: SidebarNavigationItem[] = [
    {
      label: "Dashboard",
      href: selectedAppBase ?? appsListHref,
      active: Boolean(selectedAppBase && pathname === selectedAppBase),
      dimmed: !selectedAppBase,
    },
    {
      label: "World ID",
      href: resolveWorldIdHref(
        selectedAppIds,
        appEnvironmentFlags,
        appsListHref,
      ),
      active: Boolean(
        selectedAppBase &&
          isWithinAnyAppPath(pathname, selectedAppBase, WORLD_ID_SECTION_ROOTS),
      ),
      dimmed: !selectedAppBase,
    },
    {
      label: "Configuration",
      href: selectedAppIds ? urls.configuration(selectedAppIds) : appsListHref,
      active: Boolean(
        selectedAppBase &&
          isWithinAppPath(pathname, selectedAppBase, "/configuration"),
      ),
      dimmed: !selectedAppBase,
    },
    {
      label: "Mini App",
      href: selectedAppIds ? urls.miniApp(selectedAppIds) : appsListHref,
      active: Boolean(
        selectedAppBase &&
          isWithinAppPath(pathname, selectedAppBase, "/mini-app"),
      ),
      dimmed: !selectedAppBase,
    },
  ];

  const membersHref = urls.teams({ team_id: teamId });
  const apiKeysHref = urls.teamApiKeys({ team_id: teamId });
  const settingsHref = urls.teamSettings({ team_id: teamId });
  const teamItems: SidebarNavigationItem[] = [
    {
      label: "Members",
      href: membersHref,
      active: pathname === membersHref,
    },
    ...(canSeeApiKeys
      ? [
          {
            label: "API Keys",
            href: apiKeysHref,
            active: isSameRouteOrDescendant(pathname, apiKeysHref),
          },
        ]
      : []),
    ...(canSeeSettings
      ? [
          {
            label: "Settings",
            href: settingsHref,
            active: isSameRouteOrDescendant(pathname, settingsHref),
          },
        ]
      : []),
  ];

  return { kind: "main", appItems, teamItems };
};

/**
 * Builds the complete sidebar view model. The current URL controls section
 * state while the dropdown selection supplies app links on team-only routes.
 */
export const buildSidebarNavigation = (
  params: BuildSidebarNavigationParams,
): SidebarNavigation =>
  buildSectionNavigation(params) ?? buildMainNavigation(params);
