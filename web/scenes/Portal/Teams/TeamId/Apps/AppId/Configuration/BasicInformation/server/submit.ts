"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  getIsUserAllowedToUpdateApp,
  getIsUserAllowedToUpdateAppMetadata,
} from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { schema } from "../form-schema";
import { getSdk as getUpdateAppSdk } from "../graphql/server/update-app.generated";

export async function validateAndSubmitServerSide(
  app_metadata_id: string,
  app_id: string,
  input: {
    name?: string;
    integration_url?: string;
    app_website_url?: string;
  },
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        app_id: app_id ?? undefined,
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const isUserAllowedToUpdateApp = await getIsUserAllowedToUpdateApp(app_id);
    if (!isUserAllowedToUpdateApp) {
      return errorFormAction({
        message: "The user does not have permission to update this app",
        app_id,
        team_id: teamId,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      return errorFormAction({
        message: "The provided app metadata basic information is invalid",
        additionalInfo: { app_metadata_id, input },
        team_id: teamId,
        app_id: app_id ?? undefined,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppSdk(client).UpdateAppInfo({
      app_metadata_id,
      input: {
        name: parsedInput.name,
        integration_url: parsedInput.integration_url,
        app_website_url: parsedInput.app_website_url || null,
      },
    });

    return {
      success: true,
      message: "App information updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      message: "An error occurred while updating the app information",
      error: error as Error,
      additionalInfo: { app_metadata_id, input },
      team_id: teamId,
      app_id: app_id ?? undefined,
      logLevel: "error",
    });
  }
}
