import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { ChevronLeftIcon } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { TeamsDropdown } from "./TeamsDropdown";
import { UserPopup } from "./UserPopup";

export const PortalSidebar = (props: {
  user: { name?: string | null; email?: string | null };
  teams: { id: string; name: string }[];
  sandboxRequest?: SandboxAccessRequestState | null;
}) => {
  const { user, teams, sandboxRequest } = props;
  const name = user.name ?? user.email ?? "Account";

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-(--portal-header-height) shrink-0 justify-center border-b border-portal-border px-4 py-0">
        <TeamsDropdown teams={teams} />
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-3">
        <SidebarNav initialSandboxRequest={sandboxRequest} />
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <UserPopup
          user={{ name, email: user.email ?? undefined }}
          color={calculateColorFromString(name)}
        />
      </SidebarFooter>

      <SidebarRail
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
        tabIndex={0}
        className="group/sidebar-rail isolate cursor-pointer! group-data-[collapsible=offcanvas]:hidden! after:z-0 after:w-px after:bg-transparent after:transition-colors hover:after:bg-grey-300 focus-visible:after:bg-grey-300"
      >
        <span className="absolute top-1/2 left-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 scale-90 cursor-pointer items-center justify-center rounded-full border border-grey-200 bg-grey-0 text-portal-muted opacity-0 shadow-sm transition-[opacity,transform,color,background-color,border-color,box-shadow] group-hover/sidebar-rail:scale-100 group-hover/sidebar-rail:text-portal-text group-hover/sidebar-rail:opacity-100 group-focus-visible/sidebar-rail:scale-100 group-focus-visible/sidebar-rail:text-portal-text group-focus-visible/sidebar-rail:opacity-100 hover:border-grey-300 hover:bg-grey-100 hover:shadow-md">
          <ChevronLeftIcon className="size-3.5" />
        </span>
      </SidebarRail>
    </Sidebar>
  );
};
