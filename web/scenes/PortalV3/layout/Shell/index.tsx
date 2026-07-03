import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { DangerZoneButton } from "./DangerZoneButton";
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
      className="bg-background grid min-h-[100dvh]"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="border-border bg-sidebar sticky top-0 flex h-[100dvh] flex-col border-r">
        <TeamsDropdown teams={teams} />
        <SidebarNav />

        <div className="border-border mt-auto border-t p-2">
          <UserPopup
            user={{
              name: user.name ?? user.email ?? "Account",
              email: user.email ?? undefined,
            }}
            color={color}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-border flex h-14 items-center gap-3 border-b px-4">
          <AppsDropdown />
          <DangerZoneButton />
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
