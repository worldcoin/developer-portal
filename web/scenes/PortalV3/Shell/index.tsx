import { ReactNode } from "react";

/**
 * v3 app shell — SKELETON (Slice 2).
 *
 * Establishes the stable two-column structure (sidebar + content) on the v3
 * semantic tokens, so the in-place flag branch has something to render. The real
 * team/app switchers, nav items, user popup, theme toggle, and status dot land
 * in Slice 3 (see docs/v3-design-foundation.md). Placeholders below are clearly
 * non-interactive on purpose.
 */
export const V3Shell = (props: { teamId?: string; children: ReactNode }) => {
  const appNav = ["Dashboard", "World ID", "Configuration", "Mini App"];
  const teamNav = ["Members", "API Keys", "Settings"];

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

        {/* Nav groups — placeholders (Slice 3) */}
        <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {appNav.map((label) => (
            <span
              key={label}
              className="rounded-8 px-2.5 py-1.5 font-gta text-14 font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
          <div className="my-2 border-t border-border" />
          {teamNav.map((label) => (
            <span
              key={label}
              className="rounded-8 px-2.5 py-1.5 font-gta text-14 font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </nav>

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
