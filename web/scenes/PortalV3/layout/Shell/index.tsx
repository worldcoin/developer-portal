import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CSSProperties, ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { AppNavigationProvider } from "./NavigationContext";
import { PortalSidebar } from "./PortalSidebar";

/** Portal shell, mounted at the (portal) root for allow-listed users. */
export const PortalShell = (props: {
  user: { name?: string | null; email?: string | null };
  teams?: { id: string; name: string }[];
  sandboxRequest?: SandboxAccessRequestState | null;
  children?: ReactNode;
}) => {
  const { user, teams = [], sandboxRequest = null, children } = props;

  return (
    <TooltipProvider>
      <AppNavigationProvider>
        <SidebarProvider
          data-testid="portal-shell"
          className="min-h-[100dvh] bg-portal-canvas font-world"
          style={
            {
              "--sidebar-width": "280px",
              "--portal-header-height": "67px",
              "--sidebar": "var(--color-portal-canvas)",
              "--sidebar-foreground": "var(--color-portal-muted)",
              "--sidebar-accent": "var(--color-portal-border)",
              "--sidebar-accent-foreground": "var(--color-portal-text)",
              "--sidebar-border": "var(--color-portal-border)",
            } as CSSProperties
          }
        >
          <PortalSidebar
            user={user}
            teams={teams}
            sandboxRequest={sandboxRequest}
          />

          <SidebarInset className="min-h-[100dvh] min-w-0 bg-white">
            <header className="flex h-(--portal-header-height) shrink-0 items-center gap-3 border-b border-portal-border bg-portal-canvas px-4 md:px-5">
              <SidebarTrigger
                aria-label="Open sidebar"
                title="Open sidebar"
                className="size-8 shrink-0 text-portal-muted hover:bg-portal-border hover:text-portal-text md:data-[state=expanded]:hidden"
              />
              <AppsDropdown />
            </header>

            <div className="min-w-0 flex-1 overflow-auto bg-white">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AppNavigationProvider>
    </TooltipProvider>
  );
};
