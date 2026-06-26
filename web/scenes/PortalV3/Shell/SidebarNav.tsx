"use client";

import { urls } from "@/lib/urls";
import { useParams, usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

/**
 * The stable sidebar nav. The app-scope group renders only when an app is
 * selected (read from the route); the team-scope group is always available.
 * Permission-driven disabling (disable-not-hide) wires in later via the central
 * policy.
 */
export const SidebarNav = () => {
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;

  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  const appItems = appBase
    ? [
        { label: "Dashboard", href: appBase, exact: true },
        { label: "World ID", href: `${appBase}/world-id` },
        { label: "Configuration", href: `${appBase}/configuration` },
        { label: "Mini App", href: `${appBase}/mini-app` },
      ]
    : [];

  const teamItems = teamId
    ? [
        { label: "Members", href: `/teams/${teamId}/members` },
        { label: "API Keys", href: `/teams/${teamId}/api-keys` },
        { label: "Settings", href: `/teams/${teamId}/settings` },
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
          active={isActive(item.href, item.exact)}
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
          active={isActive(item.href)}
        />
      ))}
    </nav>
  );
};
