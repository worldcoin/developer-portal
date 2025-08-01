"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateTeam } from "@/lib/permissions";
import { teamNameSchema } from "@/lib/schema";
import { FormActionResult } from "@/lib/types";
import { getSdk as getUpdateTeamSdk } from "../graphql/server/update-team.generated";

export async function validateAndUpdateTeamServerSide(
  teamName: string,
  teamId: string,
): Promise<FormActionResult> {
  try {
    const isUserAllowedToUpdateTeam =
      await getIsUserAllowedToUpdateTeam(teamId);
    if (!isUserAllowedToUpdateTeam) {
      return errorFormAction({
        message: "The user does not have permission to update this team",
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedTeamName } =
      await validateRequestSchema({
        schema: teamNameSchema,
        value: teamName,
      });

    if (!isValid || !parsedTeamName) {
      return errorFormAction({
        message: "The provided team data is invalid",
        additionalInfo: { teamName },
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateTeamSdk(client).UpdateTeam({
      id: teamId,
      input: {
        name: parsedTeamName,
      },
    });

    return {
      success: true,
      message: "Team updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the team",
      additionalInfo: { teamName },
      team_id: teamId,
      logLevel: "error",
    });
  }
}
