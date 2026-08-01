import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

export type SidebarSubNavigationItem = {
  label: string;
  href: string;
  active: boolean;
  icon?: ReactNode;
};

export type GetSidebarNavigationHandler = (
  href: string,
) => MouseEventHandler<HTMLAnchorElement>;

export const SidebarSubNavigation = (props: {
  label: string;
  items: SidebarSubNavigationItem[];
  getNavigationHandler: GetSidebarNavigationHandler;
}) => (
  <SidebarMenuSub
    aria-label={props.label}
    className="mt-2 mr-0 ml-5 border-portal-border pr-0 pl-2.5"
  >
    {props.items.map((item) => (
      <SidebarMenuSubItem key={item.href}>
        <SidebarMenuSubButton
          asChild
          size="sm"
          isActive={item.active}
          className="h-9 cursor-pointer px-3 font-world text-portal-muted hover:bg-portal-border hover:text-portal-text data-[active=true]:bg-white data-[active=true]:text-portal-text [&>svg]:text-current"
        >
          <Link
            href={item.href}
            onClick={props.getNavigationHandler(item.href)}
            aria-current={item.active ? "page" : undefined}
          >
            {item.icon ? (
              <span className={`${opticalIconClassName} text-current`}>
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ))}
  </SidebarMenuSub>
);
