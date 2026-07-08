import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { SidebarNav } from "./SidebarNav";
import { TeamsDropdown } from "./TeamsDropdown";
import { UserPopup } from "./UserPopup";

/** Portal shell, mounted at the (portal) root for allow-listed users. */
export const PortalShell = (props: {
  user: { name?: string | null; email?: string | null };
  teams?: { id: string; name: string }[];
  children?: ReactNode;
}) => {
  const { user, teams = [], children } = props;
  const color = calculateColorFromString(user.name ?? user.email ?? "");

  return (
    <div
      data-testid="portal-shell"
      className="grid min-h-[100dvh] bg-portal-canvas"
      style={{ gridTemplateColumns: "280px minmax(0, 1fr)" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col bg-portal-canvas">
        <TeamsDropdown teams={teams} />
        <SidebarNav />

        <div className="mt-auto px-4 pb-4">
          <UserPopup
            user={{
              name: user.name ?? user.email ?? "Account",
              email: user.email ?? undefined,
            }}
            color={color}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col bg-white">
        <header className="flex h-[67px] shrink-0 items-end gap-3 border-b border-l border-portal-border bg-portal-canvas pb-5 pl-[31px] pr-5">
          <AppsDropdown />
        </header>
        <main className="min-w-0 flex-1 overflow-auto border-l border-portal-border bg-white">
          {children}
        </main>
      </div>
    </div>
  );
};
