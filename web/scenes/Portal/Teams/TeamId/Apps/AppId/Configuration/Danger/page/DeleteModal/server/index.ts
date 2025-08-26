"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToDeleteApp } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteAppSdk } from "../graphql/server/delete-app.generated";

export async function deleteApp(appId: string): Promise<FormActionResult> {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

  try {
    const isUserAllowedToDeleteApp = await getIsUserAllowedToDeleteApp(appId);

    if (!isUserAllowedToDeleteApp) {
      return errorFormAction({
        message: "The user does not have permission to delete this app",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const deleteAppSdk = getDeleteAppSdk(client);

    await deleteAppSdk.DeleteApp({
      id: appId,
    });

    return {
      success: true,
      message: "App deleted successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while deleting the app",
      additionalInfo: { appId },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}
