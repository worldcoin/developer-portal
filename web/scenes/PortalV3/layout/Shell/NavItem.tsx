import { Link } from "@/components/Link";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  dimmed?: boolean;
}) => {
  const { href, label, icon, trailing, active, dimmed } = props;

  const className = twMerge(
    "flex h-10 min-w-0 items-center gap-2 rounded-[10px] pl-3 pr-4 font-world text-13 font-normal leading-none outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:ring-offset-portal-canvas",
    active
      ? "border border-portal-border bg-white text-portal-text shadow-portal-card"
      : "text-portal-muted hover:bg-portal-border hover:text-portal-text",
    dimmed && "opacity-40",
  );

  const content = (
    <>
      {/* -translate-y-px: the 16px icon centers geometrically on the row, but
          the cap-height label sits high in its leading-none line box, so
          dead-center reads as slightly low. This nudges the icon onto the
          text's optical center. */}
      {icon ? (
        <span className="shrink-0 -translate-y-px text-current">{icon}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
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
