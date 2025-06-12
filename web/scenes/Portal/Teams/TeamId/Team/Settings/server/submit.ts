"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateTeam } from "@/lib/permissions";
import { teamNameSchema } from "@/lib/schema";
import { getSdk as getUpdateTeamSdk } from "../graphql/server/update-team.generated";

export async function validateAndUpdateTeamServerSide(
  teamName: string,
  teamId: string,
) {
  try {
    const isUserAllowedToUpdateTeam =
      await getIsUserAllowedToUpdateTeam(teamId);
    if (!isUserAllowedToUpdateTeam) {
      errorFormAction({
        message: "validateAndUpdateTeamServerSide - invalid permissions",
        additionalInfo: { teamName },
        team_id: teamId,
      });
    }

    const { isValid, parsedParams: parsedTeamName } =
      await validateRequestSchema({
        schema: teamNameSchema,
        value: teamName,
      });

    if (!isValid || !parsedTeamName) {
      errorFormAction({
        message: "validateAndUpdateTeamServerSide - invalid input",
        additionalInfo: { teamName },
        team_id: teamId,
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateTeamSdk(client).UpdateTeam({
      id: teamId,
      input: {
        name: parsedTeamName,
      },
    });
  } catch (error) {
    errorFormAction({
      error: error as Error,
      message: "validateAndUpdateTeamServerSide - error updating team",
      additionalInfo: { teamName },
      team_id: teamId,
    });
  }
}
