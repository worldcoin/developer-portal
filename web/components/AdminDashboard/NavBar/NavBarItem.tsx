"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { useNav } from "../NavProvider";

type NavBarItemProps = {
  /** UI Kit asset name in /images/portal-v3/icons; `{name}-active` must exist too. */
  iconName: string;
  iconClassName?: string;
  children: ReactNode;
  href: string;
};

export const NavBarItem = ({
  iconName,
  iconClassName,
  children,
  href,
}: NavBarItemProps) => {
  const { isCollapsed } = useNav();
  const pathname = usePathname();
  const isActive =
    href === "/admin"
      ? pathname === href || pathname === `${href}/`
      : pathname === href || pathname.startsWith(`${href}/`);
  const label = typeof children === "string" ? children : undefined;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? label : undefined}
      className={clsx(
        // Base (mobile): icon stacked above label, centered tab
        "grid min-w-16 cursor-pointer items-center justify-items-center gap-y-1 rounded-12 px-3 py-2 outline-hidden",
        "transition-[grid-template-columns,gap,background-color,color] motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-blue-500",
        isActive
          ? "bg-grey-100 text-grey-900"
          : "text-grey-500 hover:bg-grey-100 hover:text-grey-900",

        // Desktop: icon and label in a row, collapsible
        "lg:justify-start lg:justify-items-stretch lg:gap-y-0 lg:rounded-8 lg:py-1.5",
        "3xl:py-2",
        "4xl:py-2.5",
        {
          "lg:min-w-48 lg:grid-cols-auto/1fr lg:gap-x-2.5": !isCollapsed,
          "3xl:min-w-60 3xl:gap-x-3": !isCollapsed,
          "4xl:min-w-84 4xl:gap-x-4": !isCollapsed,
          "lg:min-w-0 lg:grid-cols-[auto_0fr] lg:gap-x-0": isCollapsed,
        },
      )}
    >
      <Icon
        name={isActive ? `${iconName}-active` : iconName}
        className={clsx(opticalIconClassName, iconClassName)}
      />
      <span
        className={clsx(
          "min-w-0 truncate text-11 leading-none font-medium",
          "lg:text-14",
          "3xl:text-18",
          "4xl:text-24",
        )}
      >
        {children}
      </span>
    </Link>
  );
};
