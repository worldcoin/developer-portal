"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { schema } from "../form-schema";
import {
  getSdk as getUpdateAppSdk,
  UpdateAppInfoMutationVariables,
} from "../graphql/server/update-app.generated";

export async function validateAndSubmitServerSide(
  app_metadata_id: string,
  input: UpdateAppInfoMutationVariables["input"],
) {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        app_id: input?.app_id ?? undefined,
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      errorFormAction({
        message: "The provided app metadata basic information is invalid",
        additionalInfo: { app_metadata_id, input },
        team_id: teamId,
        app_id: input?.app_id ?? undefined,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppSdk(client).UpdateAppInfo({
      app_metadata_id,
      input: {
        name: parsedInput.name,
        integration_url: parsedInput.integration_url,
      },
    });
  } catch (error) {
    return errorFormAction({
      message:
        "An error occurred while updating the app metadata basic information",
      error: error as Error,
      additionalInfo: { app_metadata_id, input },
      team_id: teamId,
      app_id: input?.app_id ?? undefined,
      logLevel: "error",
    });
  }
}
