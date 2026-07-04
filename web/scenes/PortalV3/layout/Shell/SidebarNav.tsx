"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, usePathname } from "next/navigation";
import { useCurrentAppId } from "./AppsDropdown";
import { NavItem } from "./NavItem";

export const SidebarNav = () => {
  const { user } = useUser() as Auth0SessionUser;
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string }>();
  const teamId = params?.teamId;
  const appId = useCurrentAppId();

  const canSeeApiKeys = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const canSeeSettings = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
  ]);

  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  // Fallback for when no app has been visited yet this session (appId comes
  // from useCurrentAppId, which remembers the last app opened under this
  // team). The apps resolver redirects to an arbitrary app's dashboard, so it
  // must only ever be the last resort.
  const appsListHref = teamId ? urls.apps({ team_id: teamId }) : undefined;

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
          href: appBase
            ? urls.worldId40({ team_id: teamId, app_id: appId! })
            : appsListHref ?? "#",
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
