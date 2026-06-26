import { getSession } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { redirect } from "next/navigation";
import { urls } from "@/lib/urls";
import { ReactNode } from "react";
import { AppSwitcherContainer } from "./AppSwitcherContainer";
import { ColorInitializer } from "./ColorInitializer";
import { SidebarNav } from "./SidebarNav";
import { TeamSwitcher } from "./TeamSwitcher";
import { UserPopup } from "./UserPopup";

export const V3Shell = async (props: { teamId?: string; children: ReactNode }) => {
  const session = await getSession();
  if (!session) {
    redirect(urls.login());
  }
  const user = (session.user as Auth0SessionUser["user"]) ?? null;
  const color = calculateColorFromString(user?.name ?? user?.email ?? user?.sid);

  const memberships = user?.hasura?.memberships ?? [];
  const teams = memberships
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));
  const currentTeam = teams.find((t) => t.id === props.teamId);

  return (
    <div
      className="grid min-h-[100dvh] bg-background text-foreground"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border bg-sidebar">
        <ColorInitializer color={color} />
        {currentTeam ? (
          <TeamSwitcher currentTeam={currentTeam} teams={teams} />
        ) : null}

        <SidebarNav />

        {user ? (
          <div className="border-t border-border p-2">
            <UserPopup
              user={{ name: user.name ?? user.email ?? "Account", email: user.email }}
            />
          </div>
        ) : null}
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
