"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToDeleteTeam } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteTeamSdk } from "../graphql/server/delete-team.generated";

export async function deleteTeamServerSide(
  teamId: string,
): Promise<FormActionResult> {
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

    return {
      success: true,
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
