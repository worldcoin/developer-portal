"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getUpdateAppModeSdk } from "../graphql/server/update-app-mode.generated";

export async function updateAppMode(
  app_metadata_id: string,
  app_mode: "mini-app" | "external",
): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      return errorFormAction({
        message:
          "The user does not have permission to update this app metadata",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppModeSdk(client).UpdateAppMode({
      app_metadata_id,
      app_mode,
    });

    return {
      success: true,
      message: "App mode updated successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while updating the app mode",
      team_id: teamId,
      app_id: appId,
      additionalInfo: { app_metadata_id, app_mode },
      logLevel: "error",
    });
  }
}
