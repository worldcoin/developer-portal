"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { submitManagedRpDeactivation } from "@/api/helpers/rp-registration-flows";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToDeleteApp } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { getSdk as getDeleteAppSdk } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/Danger/page/DeleteModal/graphql/server/delete-app.generated";

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
    // signer. Best-effort and fully isolated in its own try/catch: the delete
    // has already committed, so neither a tagged failure nor an unexpected
    // throw here may surface as a delete error. The deactivate-deleted-app-rps
    // cron reconciles, and the app-state guards already stop a deleted app's
    // signer from being rotated or used in the meantime.
    try {
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
    } catch (deactivationError) {
      logger.error(
        "Unexpected error deactivating managed RP during app delete",
        { error: deactivationError, app_id: appId, team_id: teamId },
      );
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
