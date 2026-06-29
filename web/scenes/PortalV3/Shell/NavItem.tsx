"use client";

import clsx from "clsx";
import Link from "next/link";

export const NavItem = (props: {
  label: string;
  href: string;
  active?: boolean;
  dimmed?: boolean;
}) => (
  <Link
    href={props.href}
    aria-current={props.active ? "page" : undefined}
    className={clsx(
      "flex h-9 items-center rounded-8 px-3 font-gta text-14 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
      props.active
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      props.dimmed && "pointer-events-none opacity-50",
    )}
  >
    {props.label}
  </Link>
);
