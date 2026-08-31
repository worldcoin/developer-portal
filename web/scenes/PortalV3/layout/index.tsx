import { filterSelfieCheckAnalyticsEnabledApps } from "@/api/helpers/selfie-check-analytics/eligibility";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { fetchSandboxAccessRequest } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { isWorldUser } from "@/lib/is-world-user";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { getSdk as getTeamAppIdsSdk } from "./graphql/server/team-app-ids.generated";
import { PortalShell } from "./Shell";

/** Portal shell layout, mounted once at app/(portal)/layout.tsx. */
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

  // Resolve the user's apps here so the sidebar can gate its analytics entry
  // synchronously. A failure hides the entry without breaking the portal.
  let analyticsAppIds: string[] = [];
  if (userId && teams.length > 0) {
    let userAppIds: string[] = [];
    try {
      const client = await getAPIServiceGraphqlClient();
      const { app } = await getTeamAppIdsSdk(client).TeamAppIds({
        teamIds: teams.map((team) => team.id),
      });
      userAppIds = app.map(({ id }) => id);
    } catch (error) {
      logger.warn("Failed to load apps for analytics sidebar eligibility", {
        dependency: "hasura",
        userId,
        failureClass: error instanceof Error ? error.name : "UnknownError",
        error,
      });
    }

    if (userAppIds.length > 0) {
      try {
        analyticsAppIds =
          await filterSelfieCheckAnalyticsEnabledApps(userAppIds);
      } catch (error) {
        logger.warn("Failed to read analytics sidebar eligibility", {
          dependency: "redis",
          userId,
          failureClass: error instanceof Error ? error.name : "UnknownError",
          error,
        });
      }
    }
  }

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
      analyticsAppIds={analyticsAppIds}
      sandboxRequest={sandboxRequest}
    >
      {props.children}
    </PortalShell>
  );
};
