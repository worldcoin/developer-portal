"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { switcherTriggerClassName } from "./SearchableSwitcher";
import { DropdownTeam, TeamsDropdown } from "./TeamsDropdown";

export const SidebarContextHeader = (props: { teams: DropdownTeam[] }) => {
  const pathname = usePathname() ?? "";

  if (!pathname.startsWith(urls.profile())) {
    return <TeamsDropdown teams={props.teams} />;
  }

  if (props.teams.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          className={`${switcherTriggerClassName} text-portal-text hover:bg-portal-border focus-visible:bg-portal-border focus-visible:ring-0`}
        >
          <Link href={urls.dashboard()} aria-label="Back to dashboard">
            <ArrowLeftIcon
              className={`${opticalIconClassName} size-4 text-portal-muted`}
            />
            <span className="truncate">Back to dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
