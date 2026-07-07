import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { AutoTeamBootstrap } from "./AutoTeamBootstrap";
import { deriveTeamName } from "./derive-team-name";
import { PortalShell } from "./Shell";

/** v3 shell layout, mounted once at app/(portal)/layout.tsx via pickPortalVersion. */
export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const teams = (user?.hasura?.memberships ?? [])
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));

  const hasTeam = teams.length > 0;

  if (!hasTeam) {
    return (
      <AutoTeamBootstrap
        defaultName={deriveTeamName(user)}
        hasUser={!!user?.hasura?.id}
      />
    );
  }

  return (
    <PortalShell user={{ name: user?.name, email: user?.email }} teams={teams}>
      {props.children}
    </PortalShell>
  );
};
