"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/utils";
import { submitAppSchema as schema, SubmitAppSchema } from "../form-schema";
import { getSdk as getSubmitAppSdk } from "../SubmitAppModal/graphql/server/submit-app.generated";

export async function validateAndSubmitAppForReviewFormServerSide({
  input,
}: {
  input: SubmitAppSchema;
}) {
  const path = getPathFromHeaders() || "";
  const { Apps: appId } = extractIdsFromPath(path, ["Apps"]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(input.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      errorFormAction({
        message:
          "validateAndSubmitAppForReviewFormServerSide - invalid permissions",
        team_id: input.team_id,
        app_id: appId,
      });
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      errorFormAction({
        message: "validateAndSubmitAppForReviewFormServerSide - invalid input",
        additionalInfo: { input },
        team_id: input.team_id,
        app_id: appId,
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
  } catch (error) {
    errorFormAction({
      message:
        "validateAndSubmitAppForReviewFormServerSide - error submitting app for review",
      error: error as Error,
      additionalInfo: { input },
      team_id: input.team_id,
      app_id: appId,
    });
  }
}
