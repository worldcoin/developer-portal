"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import * as yup from "yup";
import { getSdk as getSubmitAppSdk } from "../SubmitAppModal/graphql/server/submit-app.generated";

const schema = yup
  .object({
    app_metadata_id: yup.string().required("App metadata id is required"),
    team_id: yup.string().required("Team id is required"),
    changelog: yup.string().required("Changelog is required"),
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
  const path = getPathFromHeaders() || "";
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

    const client = await getAPIServiceGraphqlClient();

    await getSubmitAppSdk(client).SubmitApp({
      app_metadata_id: parsedInput.app_metadata_id,
      is_developer_allow_listing:
        parsedInput.is_developer_allow_listing ?? false,
      verification_status: "awaiting_review",
      changelog: parsedInput.changelog,
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
