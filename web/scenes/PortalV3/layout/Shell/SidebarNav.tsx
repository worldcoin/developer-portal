"use client";

import { urls } from "@/lib/urls";
import { useParams, usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

export const SidebarNav = (props: {
  canSeeApiKeys?: boolean;
  canSeeSettings?: boolean;
}) => {
  const { canSeeApiKeys = false, canSeeSettings = false } = props;
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;

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
          href: appBase ? `${appBase}/world-id-4-0` : appsListHref ?? "#",
          dimmed: !appBase,
        },
        {
          label: "Configuration",
          href: appBase ? `${appBase}/configuration` : appsListHref ?? "#",
          dimmed: !appBase,
        },
        {
          label: "Mini App",
          href: appBase ? `${appBase}/mini-app` : appsListHref ?? "#",
          dimmed: !appBase,
        },
      ]
    : [];

  // Members is visible to every team member; API Keys / Settings are role-gated
  // (the caller resolves the permissions server-side via checkUserPermissions).
  const teamItems: { label: string; href: string; exact?: boolean }[] = teamId
    ? [
        { label: "Members", href: `/teams/${teamId}`, exact: true },
        ...(canSeeApiKeys
          ? [{ label: "API Keys", href: `/teams/${teamId}/api-keys` }]
          : []),
        ...(canSeeSettings
          ? [{ label: "Settings", href: `/teams/${teamId}/settings` }]
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
        <div className="my-2 border-t border-border" />
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
