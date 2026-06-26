import { Theme } from "@/lib/portal-v3/theme";
import clsx from "clsx";
import { ReactNode } from "react";
import { SidebarNav } from "./SidebarNav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * v3 app shell. Stable two-column layout on the v3 semantic tokens, with the
 * `.dark` scope applied to the root from the server-resolved theme. SidebarNav
 * and the theme toggle are real; the team/app switchers and the full user popup
 * are still placeholders (next in Slice 3). See docs/v3-design-foundation.md.
 */
export const V3Shell = (props: {
  teamId?: string;
  theme?: Theme;
  children: ReactNode;
}) => {
  const theme = props.theme ?? "light";

  return (
    <div
      data-v3-root
      className={clsx(
        "grid min-h-[100dvh] grid-cols-[16rem_1fr] bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <aside className="flex flex-col border-r border-border bg-sidebar">
        {/* Team switcher — placeholder (next) */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-3">
          <div className="size-6 rounded-8 bg-muted" />
          <span className="truncate font-gta text-14 font-medium">
            {props.teamId ? "Team" : "World"}
          </span>
        </div>

        <SidebarNav />

        {/* User area — full popup is next; the theme toggle is live */}
        <div className="flex flex-col gap-2 border-t border-border p-3">
          <ThemeToggle initialTheme={theme} />
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-muted" />
            <span className="truncate font-gta text-14 font-medium">
              Account
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Content header (app switcher) — placeholder (next) */}
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
