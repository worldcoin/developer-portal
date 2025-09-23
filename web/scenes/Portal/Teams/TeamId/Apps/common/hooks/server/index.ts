"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToUpdateVerificationStatus } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getRemoveAppFromReviewSdk } from "../graphql/server/remove-app-from-review.generated";

export async function removeAppFromReview(
  app_metadata_id: string,
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
          "The user does not have permission to remove this app from review",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const removeAppFromReviewSdk = getRemoveAppFromReviewSdk(client);

    await removeAppFromReviewSdk.RemoveAppFromReview({
      app_metadata_id: app_metadata_id,
    });

    return {
      success: true,
      message: "App removed from review successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while removing the app from review",
      additionalInfo: { app_metadata_id },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}
