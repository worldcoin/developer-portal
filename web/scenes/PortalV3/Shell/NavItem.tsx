import Link from "next/link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}) => {
  const { href, label, icon, active } = props;

  const className = twMerge(
    "flex items-center gap-2.5 rounded-8 px-2.5 py-1.5 font-gta text-14 font-medium outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  const content = (
    <>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </>
  );

  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  );
};
