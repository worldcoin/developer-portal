"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logPortalEvent } from "@/api/helpers/portal-events";
import {
  AppReviewSubmissionError,
  submitAppForReviewOperation,
} from "@/api/helpers/app-review-submission";
import { auth0 } from "@/lib/auth0";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import * as yup from "yup";

const schema = yup
  .object({
    app_metadata_id: yup.string().required("App metadata id is required"),
    team_id: yup.string().required("Team id is required"),
    changelog: yup.string().default(""),
    is_developer_allow_listing: yup
      .boolean()
      .required("This field is required"),
  })
  .noUnknown();

export type SubmitAppForReviewSchema = yup.Asserts<typeof schema>;

export async function submitAppForReviewFormServerSide({
  input,
}: {
  input: SubmitAppForReviewSchema;
}): Promise<FormActionResult> {
  const path = (await getPathFromHeaders()) || "";
  const { Apps: appId } = extractIdsFromPath(path, ["Apps"]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(input.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to submit this app for review",
        team_id: input.team_id,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      return errorFormAction({
        message: "The provided review data is invalid",
        additionalInfo: { input },
        team_id: input.team_id,
        app_id: appId,
        logLevel: "warn",
      });
    }

    if (!appId) {
      return errorFormAction({
        message: "The app path is invalid",
        team_id: input.team_id,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const session = await auth0.getSession();

    try {
      await submitAppForReviewOperation({
        client,
        appMetadataId: parsedInput.app_metadata_id,
        expectedAppId: appId,
        expectedTeamId: parsedInput.team_id,
        changelog: parsedInput.changelog,
        listingConsent: parsedInput.is_developer_allow_listing,
        actor: {
          subject: session?.user.sub ?? null,
          email: session?.user.email ?? null,
        },
      });
    } catch (error) {
      if (!(error instanceof AppReviewSubmissionError)) throw error;
      return errorFormAction({
        message: error.message,
        additionalInfo: { input },
        team_id: input.team_id,
        app_id: appId,
        logLevel: "warn",
      });
    }

    logPortalEvent({
      event: "app_submission",
      actor: "human",
      team_id: parsedInput.team_id,
      app_id: appId,
      metadata: {
        is_developer_allow_listing: parsedInput.is_developer_allow_listing,
      },
    });

    return {
      success: true,
      message: "App submitted for review successfully",
    };
  } catch (error) {
    return errorFormAction({
      message: "An error occurred while submitting the app for review",
      error: error as Error,
      additionalInfo: { input },
      team_id: input.team_id,
      app_id: appId,
      logLevel: "error",
    });
  }
}
