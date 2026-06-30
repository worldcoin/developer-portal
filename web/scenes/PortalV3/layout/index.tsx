import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { PortalShell } from "./Shell";

/**
 * Portal layout for the authenticated shell. Fetches the session once and hands
 * the shell everything it needs so chrome lives at the portal level, not under a
 * team route.
 *
 * Auth is NOT enforced here. This layout sits at the (portal) group level, which
 * also wraps the intentionally-public /kiosk/[appId]/[actionId] route, so
 * redirecting on a missing session would turn kiosk into a login-only page.
 * Middleware (web/proxy.ts protectedMatchers) gates /teams, /create-team,
 * /profile, and /join-callback; mirroring v2's PortalLayout we render with
 * whatever session exists (possibly none).
 */
export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
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
