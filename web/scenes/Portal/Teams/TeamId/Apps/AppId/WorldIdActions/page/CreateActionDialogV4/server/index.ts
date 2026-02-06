"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { getSdk as getAppRpIdSdk } from "../graphql/server/get-app-rp-id.generated";
import { getSdk as insertActionV4Sdk } from "../graphql/server/insert-action-v4.generated";
import { createActionSchemaV4, CreateActionSchemaV4 } from "./form-schema-v4";

export async function validateAndInsertActionV4(
  values: CreateActionSchemaV4,
  app_id: string,
): Promise<FormActionResult> {
  // 1. Check permissions
  const isAllowed = await getIsUserAllowedToUpdateApp(app_id);

  if (!isAllowed) {
    return errorFormAction({ message: "Permission denied" });
  }

  // 2. Get RP registration and validate status
  const client = await getAPIServiceGraphqlClient();
  const { app } = await getAppRpIdSdk(client).GetAppRpId({ app_id });

  if (!app || app.length === 0) {
    return errorFormAction({
      message: "App not found",
      additionalInfo: { app_id },
    });
  }

  const rpRegistration = app[0]?.rp_registration[0];
  const rp_id = rpRegistration?.rp_id;
  const status = rpRegistration?.status;

  if (!rp_id) {
    return errorFormAction({
      message: "App does not have RP registration",
      additionalInfo: { app_id },
    });
  }

  if (status !== "registered") {
    return errorFormAction({
      message:
        "RP registration is not active. Please ensure your app is properly registered.",
      additionalInfo: { app_id, rp_id, status },
      logLevel: "warn",
    });
  }

  // 3. Validate input
  const { isValid, parsedParams } = await validateRequestSchema({
    schema: createActionSchemaV4,
    value: values,
    app_id,
  });

  if (!isValid || !parsedParams) {
    return errorFormAction({
      message: "Invalid input",
      additionalInfo: { app_id },
      logLevel: "warn",
    });
  }

  // 4. Insert action_v4
  try {
    const { insert_action_v4_one } = await insertActionV4Sdk(
      client,
    ).InsertActionV4({
      object: {
        rp_id,
        action: parsedParams.action,
        description: parsedParams.description || "",
        environment: parsedParams.environment,
      },
    });

    return {
      success: true,
      message: "Action created successfully",
      data: { action_id: insert_action_v4_one?.id },
    };
  } catch (error: any) {
    const errorStr = JSON.stringify(error);

    // Check if this is our specific unique constraint violation
    // The constraint name will appear in the error if it's violated
    if (errorStr.includes("action_v4_rp_id_action_environment_key")) {
      return errorFormAction({
        error: error as Error,
        message: `An action with identifier "${parsedParams.action}" already exists for this environment`,
        additionalInfo: {
          app_id,
          rp_id,
          action: parsedParams.action,
        },
        logLevel: "warn",
      });
    }

    return errorFormAction({
      error: error as Error,
      message: "Failed to create action",
      additionalInfo: {
        app_id,
        rp_id,
        action: parsedParams.action,
      },
      logLevel: "error",
    });
  }
}
