"use client";

import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCurrentAppId } from "./AppsDropdown";
import { NavItem } from "./NavItem";

// App-env flags fetched server-side by the v3 AppIdLayout. The sidebar needs
// them to gate the World ID section items (which sub-pages exist depends on
// whether the app has an RP registration / legacy actions). Keyed by appId so
// flags from a previously viewed app are never applied to another.
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

type SectionNav = {
  label: string;
  items: { label: string; href: string; active: boolean }[];
};

export const SidebarNav = () => {
  const { user } = useUser() as Auth0SessionUser;
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const routeAppId = params?.appId;
  const appId = useCurrentAppId();
  const appEnvFlags = useAtomValue(appEnvFlagsAtom);

  const canSeeApiKeys = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const canSeeSettings = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
  ]);

  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  // When inside a section with sub-pages (Mini App, World ID), the sidebar
  // swaps to that section's items with a back link — sub-navigation lives
  // here instead of a tab bar above the page content.
  const getSectionNav = (): SectionNav | undefined => {
    if (!teamId || !routeAppId) return undefined;

    const base = urls.app({ team_id: teamId, app_id: routeAppId });
    if (!pathname.startsWith(base)) return undefined;
    const rel = pathname.slice(base.length);
    const within = (prefix: string) =>
      rel === prefix || rel.startsWith(`${prefix}/`);

    // /transactions and /notifications are legacy top-level aliases of the
    // /mini-app/* routes.
    if (
      within("/mini-app") ||
      within("/transactions") ||
      within("/notifications")
    ) {
      const ids = { team_id: teamId, app_id: routeAppId };
      return {
        label: "Mini App",
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
            active:
              within("/mini-app/notifications") || within("/notifications"),
          },
        ],
      };
    }

    if (
      within("/world-id-4-0") ||
      within("/world-id-actions") ||
      within("/actions")
    ) {
      const ids = { team_id: teamId, app_id: routeAppId };
      const flags = appEnvFlags?.appId === routeAppId ? appEnvFlags : undefined;
      const items = [
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

      // An app with neither an RP registration nor legacy actions has no
      // World ID sub-pages (the page shows enable/migration UI), so keep the
      // main nav.
      return items.length > 0 ? { label: "World ID", items } : undefined;
    }

    return undefined;
  };

  const sectionNav = getSectionNav();

  if (sectionNav && appBase) {
    return (
      <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <NavItem
          label="Back"
          href={appBase}
          icon={<ChevronLeftIcon className="size-4" />}
        />
        <div className="text-muted-foreground px-2.5 pb-1 pt-3 font-gta text-12 font-medium uppercase tracking-wide">
          {sectionNav.label}
        </div>
        {sectionNav.items.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            href={item.href}
            active={item.active}
          />
        ))}
      </nav>
    );
  }

  // Fallback for when no app has been visited yet this session (appId comes
  // from useCurrentAppId, which remembers the last app opened under this
  // team). The apps resolver redirects to an arbitrary app's dashboard, so it
  // must only ever be the last resort.
  const appsListHref = teamId ? urls.apps({ team_id: teamId }) : undefined;

  // Mirror v2 AppIdChrome: route the World ID entry to the legacy actions page
  // when the app has legacy actions but no RP registration, so a legacy-only
  // app's World ID tab surfaces its legacy actions instead of the 4.0
  // enable/migration page. Falls back to worldId40 when flags aren't synced
  // for this app yet (the section nav corrects once they arrive).
  const worldIdHref = (() => {
    if (!appBase || !teamId || !appId) return appsListHref ?? "#";
    const ids = { team_id: teamId, app_id: appId };
    const flags = appEnvFlags?.appId === appId ? appEnvFlags : undefined;
    if (flags?.hasRpRegistration) return urls.worldId40(ids);
    if (flags?.hasLegacyActions) return urls.actions(ids);
    return urls.worldId40(ids);
  })();

  const appItems = teamId
    ? [
      {
        label: "Dashboard",
        href: appBase ?? appsListHref ?? "#",
        exact: !!appBase,
        dimmed: !appBase,
      },
      {
        label: "World ID",
        href: worldIdHref,
        dimmed: !appBase,
      },
      {
        label: "Configuration",
        href: appBase
          ? urls.configuration({ team_id: teamId, app_id: appId! })
          : appsListHref ?? "#",
        dimmed: !appBase,
      },
      {
        label: "Mini App",
        href: appBase ? `${appBase}/mini-app` : appsListHref ?? "#",
        dimmed: !appBase,
      },
    ]
    : [];

  const teamItems: { label: string; href: string; exact?: boolean }[] = teamId
    ? [
      {
        label: "Members",
        href: urls.teams({ team_id: teamId }),
        exact: true,
      },
      // No urls helper exists for api-keys (v2 hardcodes this path too).
      ...(canSeeApiKeys
        ? [{ label: "API Keys", href: `/teams/${teamId}/api-keys` }]
        : []),
      ...(canSeeSettings
        ? [
          {
            label: "Settings",
            href: urls.teamSettings({ team_id: teamId }),
          },
        ]
        : []),
    ]
    : [];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {appItems.map((item) => (
        <NavItem
          key={item.label}
          label={item.label}
          href={item.href}
          active={!item.dimmed && isActive(item.href, item.exact)}
          dimmed={item.dimmed}
        />
      ))}
      {appItems.length > 0 && teamItems.length > 0 ? (
        <div className="border-border my-2 border-t" />
      ) : null}
      {teamItems.map((item) => (
        <NavItem
          key={item.label}
          label={item.label}
          href={item.href}
          active={isActive(item.href, item.exact)}
        />
      ))}
    </nav>
  );
};
