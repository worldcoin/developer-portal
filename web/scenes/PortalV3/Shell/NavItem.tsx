import Link from "next/link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/**
 * A single sidebar nav row. States follow docs/v3-design-foundation.md, Vercel-
 * style: default → hover (neutral fill) → active (persistent neutral fill +
 * foreground text, NO accent color) → disabled (faint, inert, tooltip — the
 * disable-not-hide model).
 */
export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) => {
  const { href, label, icon, active, disabled, disabledReason } = props;

  const className = twMerge(
    "flex items-center gap-2.5 rounded-8 px-2.5 py-1.5 font-gta text-14 font-medium outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    disabled &&
      "pointer-events-none cursor-not-allowed text-faint-foreground hover:bg-transparent hover:text-faint-foreground",
  );

  const content = (
    <>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </>
  );

  if (disabled) {
    return (
      <span
        className={className}
        role="link"
        aria-disabled="true"
        title={disabledReason}
      >
        {content}
      </span>
    );
  }

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
