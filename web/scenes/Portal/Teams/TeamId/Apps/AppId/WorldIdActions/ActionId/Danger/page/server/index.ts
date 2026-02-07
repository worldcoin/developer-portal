"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { logger } from "@/lib/logger";
import { getSdk } from "../graphql/server/delete-action-v4.generated";
import { getSdk as getActionWithAppSdk } from "../../../Settings/UpdateActionV4Form/server/graphql/server/get-action-v4-with-app.generated";

export async function deleteActionV4ServerSide(
  actionId: string,
  appId: string,
): Promise<FormActionResult> {
  // 1. Check app-level permissions
  const isAllowed = await getIsUserAllowedToUpdateApp(appId);

  if (!isAllowed) {
    return errorFormAction({
      message: "You don't have permission to delete this action",
    });
  }

  // 2. Verify action ownership (IDOR protection)
  const client = await getAPIServiceGraphqlClient();
  const { action_v4_by_pk } = await getActionWithAppSdk(
    client,
  ).GetActionV4WithApp({
    action_id: actionId,
  });

  if (!action_v4_by_pk) {
    logger.warn("Action not found during delete", {
      action_id: actionId,
      app_id: appId,
    });
    return errorFormAction({
      message: "Action not found",
    });
  }

  if (action_v4_by_pk.rp_registration.app_id !== appId) {
    logger.warn("IDOR attempt detected - action does not belong to app", {
      action_id: actionId,
      expected_app_id: appId,
      actual_app_id: action_v4_by_pk.rp_registration.app_id,
    });
    return errorFormAction({
      message: "Unauthorized",
    });
  }

  // 3. Verify production-only
  if (action_v4_by_pk.environment !== "production") {
    logger.warn("Attempted to delete non-production action", {
      action_id: actionId,
      environment: action_v4_by_pk.environment,
      app_id: appId,
    });
    return errorFormAction({
      message: "Only production actions can be deleted",
    });
  }

  // 4. Delete action_v4
  try {
    await getSdk(client).DeleteActionV4({
      id: actionId,
    });

    return {
      success: true,
      message: "Action deleted successfully",
    };
  } catch (error: any) {
    logger.error("Failed to delete action_v4", {
      error,
      action_id: actionId,
      app_id: appId,
    });

    return errorFormAction({
      error: error as Error,
      message: "Failed to delete action",
      additionalInfo: {
        app_id: appId,
        action_id: actionId,
      },
      logLevel: "error",
    });
  }
}
