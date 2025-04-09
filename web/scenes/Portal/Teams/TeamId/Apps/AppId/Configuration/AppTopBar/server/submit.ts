"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { submitAppSchema as schema, SubmitAppSchema } from "../form-schema";
import { getSdk as getSubmitAppSdk } from "../SubmitAppModal/graphql/server/submit-app.generated";

export async function validateAndSubmitAppForReviewFormServerSide({
  input,
}: {
  input: SubmitAppSchema;
}) {
  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(input.app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      throw new Error(
        "validateAndSubmitAppForReviewFormServerSide - invalid input",
      );
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
    return errorFormAction({
      message:
        "validateAndSubmitAppForReviewFormServerSide - error submitting app for review",
      error: error,
      additionalInfo: { input },
    });
  }
}
