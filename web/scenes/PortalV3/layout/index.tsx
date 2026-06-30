import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { PortalShell } from "./Shell";

/**
 * Portal layout for the authenticated shell. Fetches the session once and hands
 * the shell everything it needs so chrome lives at the portal level, not under a
 * team route.
 */
export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  if (!session) {
    redirect(urls.login());
  }
  const user = session.user as Auth0SessionUser["user"];
  const teams = (user?.hasura?.memberships ?? [])
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));

  return (
    <PortalShell user={{ name: user?.name, email: user?.email }} teams={teams}>
      {props.children}
    </PortalShell>
  );
};
