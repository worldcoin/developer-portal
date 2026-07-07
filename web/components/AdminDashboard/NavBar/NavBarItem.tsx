"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useNav } from "../NavProvider";

type NavBarItemProps = {
  icon: ReactNode;
  children: ReactNode;
  href: string;
};

export const NavBarItem = ({ icon, children, href }: NavBarItemProps) => {
  const { isCollapsed } = useNav();
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);
  const label = typeof children === "string" ? children : undefined;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? label : undefined}
      className={clsx(
        "grid cursor-pointer items-center justify-start rounded-8 px-3 py-2 outline-none",
        "transition-[grid-template-columns,gap,background-color] motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-blue-500",
        isActive ? "bg-grey-200" : "hover:bg-grey-200",
        {
          "min-w-48 grid-cols-auto/1fr gap-x-2.5": !isCollapsed,
          "min-w-0 grid-cols-[auto_0fr] gap-x-0": isCollapsed,
        },
      )}
    >
      {icon}
      <span className="min-w-0 truncate leading-none">{children}</span>
    </Link>
  );
};
