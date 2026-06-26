import { ReactNode } from "react";
import { AppSwitcherContainer } from "./AppSwitcherContainer";
import { SidebarNav } from "./SidebarNav";
import { TeamSwitcherContainer } from "./TeamSwitcherContainer";
import { UserPopupContainer } from "./UserPopupContainer";

/**
 * v3 app shell. Stable two-column layout on the v3 semantic tokens (light-only).
 * Team switcher, sidebar nav, content-header app switcher, and the bottom user
 * popup are all real. See docs/v3-design-foundation.md.
 */
export const V3Shell = (props: { teamId?: string; children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] grid-cols-[16rem_1fr] bg-background text-foreground">
      <aside className="flex flex-col border-r border-border bg-sidebar">
        <TeamSwitcherContainer />

        <SidebarNav />

        <div className="border-t border-border p-2">
          <UserPopupContainer />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          <AppSwitcherContainer />
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{props.children}</main>
      </div>
    </div>
  );
};
