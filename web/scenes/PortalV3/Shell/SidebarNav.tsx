"use client";

import { urls } from "@/lib/urls";
import { useParams, usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

/**
 * The stable sidebar nav. App-scope items reflect the selected app (read from
 * the route); when no app is selected they go disabled with a "choose an app"
 * hint (the decided All-Apps / team-scope behavior). Team-scope items are
 * always available. Permission-driven disabling is wired in a later slice via
 * the central policy.
 */
export const SidebarNav = () => {
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;

  const appBase =
    teamId && appId ? urls.app({ team_id: teamId, app_id: appId }) : undefined;

  const appItems = [
    { label: "Dashboard", href: appBase ?? "", exact: true },
    { label: "World ID", href: appBase ? `${appBase}/world-id` : "" },
    { label: "Configuration", href: appBase ? `${appBase}/configuration` : "" },
    { label: "Mini App", href: appBase ? `${appBase}/mini-app` : "" },
  ];

  const teamItems = teamId
    ? [
        { label: "Members", href: `/teams/${teamId}/members` },
        { label: "API Keys", href: `/teams/${teamId}/api-keys` },
        { label: "Settings", href: `/teams/${teamId}/settings` },
      ]
    : [];

  const isActive = (href: string, exact?: boolean) =>
    !!href && (exact ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {appItems.map((item) => (
        <NavItem
          key={item.label}
          label={item.label}
          href={item.href}
          active={isActive(item.href, item.exact)}
          disabled={!appBase}
          disabledReason={!appBase ? "Choose an app to continue" : undefined}
        />
      ))}
      <div className="my-2 border-t border-border" />
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
