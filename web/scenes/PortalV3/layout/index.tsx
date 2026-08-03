import { fetchSandboxAccessRequest } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { isWorldUser } from "@/lib/is-world-user";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { PortalShell } from "./Shell";

/** v3 shell layout, mounted once at app/(portal)/layout.tsx via pickPortalVersion. */
export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const memberships = user?.hasura?.memberships ?? [];
  const teams = memberships
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));
  const apiKeyTeamIds = memberships
    .filter(
      (membership) =>
        membership.role === Role_Enum.Owner ||
        membership.role === Role_Enum.Admin,
    )
    .map((membership) => membership.team?.id)
    .filter((teamId): teamId is string => Boolean(teamId));

  const userId = user?.hasura?.id;

  let sandboxRequest = null;
  if (userId) {
    try {
      sandboxRequest = await fetchSandboxAccessRequest(userId);
    } catch (error) {
      // The sandbox tile should not make the whole portal unavailable.
      logger.warn("Failed to hydrate sandbox access request in portal layout", {
        userId,
        error,
      });
    }
  }

  return (
    <PortalShell
      user={{
        name: user && isWorldUser(user) ? "Anonymous user" : user?.name,
        email: user?.email,
      }}
      teams={teams}
      apiKeyTeamIds={apiKeyTeamIds}
      sandboxRequest={sandboxRequest}
    >
      {props.children}
    </PortalShell>
  );
};
