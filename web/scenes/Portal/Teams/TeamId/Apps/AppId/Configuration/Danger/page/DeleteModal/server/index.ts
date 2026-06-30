"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { submitManagedRpDeactivation } from "@/api/helpers/rp-registration-flows";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToDeleteApp } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteAppSdk } from "../graphql/server/delete-app.generated";

export async function deleteApp(appId: string): Promise<FormActionResult> {
  const path = (await getPathFromHeaders()) || "";
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

    // Tear down the managed RP signer on-chain *after* the soft delete commits,
    // so a failed delete can never leave a live app with an on-chain-disabled
    // signer. Best-effort: a failure is logged and reconciled by the
    // deactivate-deleted-app-rps cron — it must not block the delete, and the
    // app-state guards already stop a deleted app's signer from being rotated
    // or used in the meantime.
    const deactivation = await submitManagedRpDeactivation({ client, appId });
    if (!deactivation.ok) {
      logger.error("Failed to deactivate managed RP during app delete", {
        app_id: appId,
        team_id: teamId,
        rp_id: deactivation.rpIdString,
        code: deactivation.code,
        detail: deactivation.detail,
      });
    }

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
