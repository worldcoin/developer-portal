import { Link } from "@/components/Link";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const sidebarNavItemClassName = (props?: {
  active?: boolean;
  dimmed?: boolean;
  className?: string;
}) =>
  twMerge(
    "flex h-10 min-w-0 items-center gap-2 rounded-[10px] pl-3 pr-4 font-world text-13 font-normal leading-none outline-hidden transition-colors",
    "focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:ring-offset-portal-canvas",
    props?.active
      ? "border border-portal-border bg-white text-portal-text shadow-portal-card"
      : "text-portal-muted hover:bg-portal-border hover:text-portal-text",
    props?.dimmed && "opacity-40",
    props?.className,
  );

export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  current?: boolean;
  dimmed?: boolean;
  className?: string;
}) => {
  const { href, label, icon, trailing, active, current, dimmed, className } =
    props;

  const content = (
    <>
      {icon ? (
        <span className={`${opticalIconClassName} text-current`}>{icon}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </>
  );

  return (
    <Link
      href={href}
      className={sidebarNavItemClassName({ active, dimmed, className })}
      aria-current={current === false ? undefined : active ? "page" : undefined}
    >
      {content}
    </Link>
  );
};
