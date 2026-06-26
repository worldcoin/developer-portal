import { getSession } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import Link from "next/link";
import { ReactNode } from "react";
import { AccountSidebarNav } from "./AccountSidebarNav";
import { ColorInitializer } from "./ColorInitializer";
import { UserPopup } from "./UserPopup";
import { WorldIcon } from "@/components/Icons/WorldIcon";

export const AccountShell = async (props: { children: ReactNode }) => {
  const session = await getSession();
  const user = (session?.user as Auth0SessionUser["user"]) ?? null;
  const color = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  return (
    <div
      className="grid min-h-[100dvh] bg-background text-foreground"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border bg-sidebar">
        <ColorInitializer color={color} />
        {/* Logo + back to teams */}
        <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
          <WorldIcon className="size-6 shrink-0" />
          <Link
            href="/teams"
            className="min-w-0 flex-1 truncate font-gta text-14 font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to teams
          </Link>
        </div>

        <AccountSidebarNav />

        {user ? (
          <div className="border-t border-border p-2">
            <UserPopup
              user={{
                name: user.name ?? user.email ?? "Account",
                email: user.email,
              }}
            />
          </div>
        ) : null}
      </aside>

      <main className="min-w-0 overflow-auto">{props.children}</main>
    </div>
  );
};
