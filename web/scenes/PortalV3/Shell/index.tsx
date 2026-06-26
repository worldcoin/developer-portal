import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";

/**
 * v3 app shell (Slice 2 structure + Slice 3 sidebar nav).
 *
 * Stable two-column layout on the v3 semantic tokens. SidebarNav is real
 * (active / disabled states per docs/v3-design-foundation.md); the team/app
 * switchers, user popup, theme toggle, and status dot are still placeholders
 * and land later in Slice 3.
 */
export const V3Shell = (props: { teamId?: string; children: ReactNode }) => {
  return (
    <div className="grid min-h-[100dvh] grid-cols-[16rem_1fr] bg-background text-foreground">
      <aside className="flex flex-col border-r border-border bg-sidebar">
        {/* Team switcher — placeholder (Slice 3) */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-3">
          <div className="size-6 rounded-8 bg-muted" />
          <span className="truncate font-gta text-14 font-medium">
            {props.teamId ? "Team" : "World"}
          </span>
        </div>

        <SidebarNav />

        {/* User popup — placeholder (Slice 3) */}
        <div className="flex h-14 items-center gap-2.5 border-t border-border px-3">
          <div className="size-6 rounded-full bg-muted" />
          <span className="truncate font-gta text-14 font-medium">Account</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Content header (app switcher) — placeholder (Slice 3) */}
        <header className="flex h-14 items-center border-b border-border px-4">
          <span className="font-gta text-14 font-medium text-muted-foreground">
            App switcher
          </span>
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{props.children}</main>
      </div>
    </div>
  );
};
