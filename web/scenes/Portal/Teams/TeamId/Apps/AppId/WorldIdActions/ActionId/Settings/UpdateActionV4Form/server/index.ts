"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { logger } from "@/lib/logger";
import { getSdk } from "./graphql/server/update-action-v4.generated";
import {
  createActionSchemaV4,
  CreateActionSchemaV4,
} from "../../../../page/CreateActionDialogV4/server/form-schema-v4";

export async function updateActionV4ServerSide(
  values: CreateActionSchemaV4,
  actionId: string,
  appId: string,
): Promise<FormActionResult> {
  // 1. Check permissions
  const isAllowed = await getIsUserAllowedToUpdateApp(appId);

  if (!isAllowed) {
    return errorFormAction({
      message: "You don't have permission to update this action",
    });
  }

  // 2. Validate input
  const { isValid, parsedParams } = await validateRequestSchema({
    schema: createActionSchemaV4,
    value: values,
    app_id: appId,
  });

  if (!isValid || !parsedParams) {
    return errorFormAction({
      message: "Invalid input",
      additionalInfo: { app_id: appId, action_id: actionId },
      logLevel: "warn",
    });
  }

  // 3. Update action_v4 (only description and environment, not identifier)
  try {
    const client = await getAPIServiceGraphqlClient();
    await getSdk(client).UpdateActionV4({
      id: actionId,
      input: {
        description: parsedParams.description || "",
        environment: parsedParams.environment,
        // Note: action (identifier) is NOT updated - it's read-only
      },
    });

    return {
      success: true,
      message: "Action settings updated successfully",
    };
  } catch (error: any) {
    logger.error("Failed to update action_v4 settings", {
      error,
      action_id: actionId,
      app_id: appId,
    });

    return errorFormAction({
      error: error as Error,
      message: "Failed to update action settings",
      additionalInfo: {
        app_id: appId,
        action_id: actionId,
      },
      logLevel: "error",
    });
  }
}
