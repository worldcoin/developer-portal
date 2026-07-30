import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import Link from "next/link";
import { ReactNode } from "react";

export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  current?: boolean;
  dimmed?: boolean;
  className?: string;
  children?: ReactNode;
}) => {
  const {
    href,
    label,
    icon,
    trailing,
    active,
    current,
    dimmed,
    className,
    children,
  } = props;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          // The resting border is transparent (not absent) so the active
          // row's visible border doesn't shift the label by a pixel.
          "h-10 cursor-pointer rounded-[10px] border border-transparent px-3 font-world text-13 leading-none font-normal text-portal-muted hover:bg-portal-hover hover:text-portal-text data-[active=true]:border-portal-border data-[active=true]:bg-grey-0 data-[active=true]:text-portal-text data-[active=true]:shadow-portal-card",
          className,
        )}
      >
        <Link
          href={href}
          prefetch={false}
          aria-current={
            current === false ? undefined : active ? "page" : undefined
          }
          className={dimmed ? "opacity-40" : undefined}
        >
          {icon ? (
            <span className={`${opticalIconClassName} text-current`}>
              {icon}
            </span>
          ) : null}
          <span>{label}</span>
          {trailing ? (
            <span className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
              {trailing}
            </span>
          ) : null}
        </Link>
      </SidebarMenuButton>
      {children}
    </SidebarMenuItem>
  );
};
