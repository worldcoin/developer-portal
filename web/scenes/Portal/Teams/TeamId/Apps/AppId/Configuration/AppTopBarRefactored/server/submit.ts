"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
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
