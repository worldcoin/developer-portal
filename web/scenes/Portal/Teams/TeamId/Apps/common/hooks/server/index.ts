"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToUpdateVerificationStatus } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getUpdateAppVerificationStatusSdk } from "../graphql/server/update-app-verification-status.generated";

export async function updateAppVerificationStatus(
  app_metadata_id: string,
  verification_status: string,
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    const isUserAllowedToUpdateVerificationStatus =
      await getIsUserAllowedToUpdateVerificationStatus(app_metadata_id);

    if (!isUserAllowedToUpdateVerificationStatus) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app verification status",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const updateAppVerificationStatusSdk =
      getUpdateAppVerificationStatusSdk(client);

    await updateAppVerificationStatusSdk.UpdateAppVerificationStatus({
      app_metadata_id: app_metadata_id,
      verification_status: verification_status,
    });

    return {
      success: true,
      message: "App verification status updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the app verification status",
      additionalInfo: { app_metadata_id, verification_status },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}
