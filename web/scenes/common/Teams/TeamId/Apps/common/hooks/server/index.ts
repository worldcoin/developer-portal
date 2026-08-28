"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk as getWithdrawListingReviewSubmissionSdk } from "@/api/helpers/graphql/withdraw-listing-review-submission.generated";
import { auth0 } from "@/lib/auth0";
import { getIsUserAllowedToUpdateVerificationStatus } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";

export async function removeAppFromReview(
  app_metadata_id: string,
): Promise<FormActionResult> {
  const path = (await getPathFromHeaders()) || "";
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
        code: "FORBIDDEN",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const session = await auth0.getSession();
    await getWithdrawListingReviewSubmissionSdk(
      client,
    ).WithdrawListingReviewSubmission({
      app_metadata_id,
      actor_subject: session?.user.sub ?? null,
      actor_email: session?.user.email ?? null,
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
      code: "UNKNOWN",
    });
  }
}
