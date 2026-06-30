"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

export const SidebarNav = () => {
  const { user } = useUser() as Auth0SessionUser;
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;

  const canSeeApiKeys = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const canSeeSettings = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
  ]);

  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  // When no app is selected, app items still render but link to the apps
  // resolver (urls.apps) so clicking them prompts the user to pick an app.
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
