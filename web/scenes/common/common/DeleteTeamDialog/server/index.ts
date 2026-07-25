"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk as getFetchUserForSessionSdk } from "@/api/update-session/graphql/server/fetch-user-for-session.generated";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToDeleteTeam } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteTeamSdk } from "../graphql/server/delete-team.generated";

export async function deleteTeamServerSide(
  teamId: string,
): Promise<FormActionResult & { sessionUpdated?: boolean }> {
  try {
    const isUserAllowedToDeleteTeam =
      await getIsUserAllowedToDeleteTeam(teamId);
    if (!isUserAllowedToDeleteTeam) {
      return errorFormAction({
        message: "The user does not have permission to delete this team",
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getDeleteTeamSdk(client).DeleteTeam({
      id: teamId,
    });

    // Rewrite the session cookie before resolving, so callers can re-render
    // session-fed UI without racing a client-side sync
    let sessionUpdated = false;
    try {
      const session = await auth0.getSession();
      const userId = session?.user?.hasura?.id;

      if (session && userId) {
        const { user_by_pk } = await getFetchUserForSessionSdk(
          client,
        ).FetchUserForSession({ userId });

        if (user_by_pk) {
          await auth0.updateSession({
            ...session,
            user: { ...session.user, hasura: user_by_pk },
          });
          sessionUpdated = true;
        }
      }
    } catch (error) {
      logger.error("Team deleted but session refresh failed", {
        error,
        teamId,
      });
    }

    return {
      success: true,
      sessionUpdated,
      message: "Team deleted successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while deleting the team",
      additionalInfo: { teamId },
      team_id: teamId,
      logLevel: "error",
    });
  }
}
