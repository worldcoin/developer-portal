"use client";

import { usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

export const AccountSidebarNav = () => {
  const pathname = usePathname() ?? "";

  const items = [
    { label: "Profile", href: "/profile", exact: true },
    { label: "My Teams", href: "/profile/teams" },
    { label: "Danger Zone", href: "/profile/danger" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {items.map((item) => (
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
