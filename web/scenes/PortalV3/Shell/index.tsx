import { Theme } from "@/lib/portal-v3/theme";
import clsx from "clsx";
import { ReactNode } from "react";
import { AppSwitcherContainer } from "./AppSwitcherContainer";
import { SidebarNav } from "./SidebarNav";
import { TeamSwitcherContainer } from "./TeamSwitcherContainer";
import { UserPopupContainer } from "./UserPopupContainer";

/**
 * v3 app shell. Stable two-column layout on the v3 semantic tokens, with the
 * `.dark` scope applied to the root from the server-resolved theme. SidebarNav,
 * the content-header app switcher, and the bottom user popup (which houses the
 * theme toggle) are real; only the team switcher is still a placeholder.
 * See docs/v3-design-foundation.md.
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
        <TeamSwitcherContainer />

        <SidebarNav />

        <div className="border-t border-border p-2">
          <UserPopupContainer theme={theme} />
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
