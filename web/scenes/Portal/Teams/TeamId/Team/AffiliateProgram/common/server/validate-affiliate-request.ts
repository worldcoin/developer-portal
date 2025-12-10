"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { Auth0SessionUser, FormActionResult } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk } from "./graphql/getTeamVerifiedApps.generated";

type ValidatedRequest = {
  teamId: string;
  user: Auth0SessionUser["user"];
};

type ValidationResult =
  | { success: true; data: ValidatedRequest }
  | { success: false; error: FormActionResult };

/**
 * Validates teamId and user authentication for affiliate server actions
 * @returns Validation result with teamId and user, or error FormActionResult
 */
export const validateAffiliateRequest = async (): Promise<ValidationResult> => {
  const path = getPathFromHeaders() || "";
  const { teams: teamId } = extractIdsFromPath(path, ["teams"]);

  if (!teamId) {
    return {
      success: false,
      error: errorFormAction({
        message: "team id is not set",
        team_id: teamId,
        logLevel: "error",
      }),
    };
  }

  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return {
      success: false,
      error: errorFormAction({
        message: "user is not authenticated",
        team_id: teamId,
        logLevel: "error",
      }),
    };
  }

  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  if (!isTeamMember) {
    return {
      success: false,
      error: errorFormAction({
        message: "user is not a team member",
        team_id: teamId,
        logLevel: "error",
      }),
    };
  }

  const client = await getAPIServiceGraphqlClient();

  const data = await getSdk(client).GetTeamVerifiedApps({
    teamId: teamId,
  });
  const hasVerifiedApps = (data.app.length || 0) > 0;

  if (!hasVerifiedApps) {
    return {
      success: false,
      error: errorFormAction({
        message: "affiliate program is not enabled for this team",
        team_id: teamId,
        logLevel: "error",
      }),
    };
  }

  return {
    success: true,
    data: { teamId, user },
  };
};
