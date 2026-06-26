"use server";

import { getSdk as getClaimRpSdk } from "@/api/hasura/register-rp/graphql/claim-rp-registration.generated";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logPortalEvent } from "@/api/helpers/portal-events";
import { generateRpIdString } from "@/api/helpers/rp-utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { GraphQLClient } from "graphql-request";
import { getSdk as getAppRpIdSdk } from "../graphql/server/get-app-rp-id.generated";
import { getSdk as insertActionV4Sdk } from "../graphql/server/insert-action-v4.generated";
import { createActionSchemaV4, CreateActionSchemaV4 } from "./form-schema-v4";

async function ensureRpIdForAction(
  client: GraphQLClient,
  app_id: string,
): Promise<string | null> {
  const { app } = await getAppRpIdSdk(client).GetAppRpId({ app_id });
  const existingRpId = app?.[0]?.rp_registration[0]?.rp_id;
  if (existingRpId) {
    return existingRpId;
  }

  const rpIdString = generateRpIdString(app_id);
  const { insert_rp_registration_one: claimedSlot } = await getClaimRpSdk(
    client,
  ).ClaimRpRegistration({
    rp_id: rpIdString,
    app_id,
    mode: "self_managed",
    signer_address: null,
  });

  if (claimedSlot?.rp_id) {
    return claimedSlot.rp_id;
  }

  const { app: refetchedApp } = await getAppRpIdSdk(client).GetAppRpId({
    app_id,
  });
  return refetchedApp?.[0]?.rp_registration[0]?.rp_id ?? null;
}

export async function validateAndInsertActionV4(
  values: CreateActionSchemaV4,
  app_id: string,
): Promise<FormActionResult> {
  // 1. Check permissions
  const isAllowed = await getIsUserAllowedToUpdateApp(app_id);

  if (!isAllowed) {
    return errorFormAction({ message: "Permission denied" });
  }

  const client = await getAPIServiceGraphqlClient();
  const { app } = await getAppRpIdSdk(client).GetAppRpId({ app_id });

  if (!app || app.length === 0) {
    return errorFormAction({
      message: "App not found",
      additionalInfo: { app_id },
    });
  }

  const appRecord = app[0];
  if (appRecord.is_staging && appRecord.rp_registration.length === 0) {
    return errorFormAction({
      message: "Staging apps cannot create World ID 4.0 actions",
      additionalInfo: { app_id },
      logLevel: "warn",
    });
  }

  // Lazily claim an RP slot when needed so the
  // first action create is never blocked by the World ID tab enable dialog.
  const rp_id = await ensureRpIdForAction(client, app_id);

  if (!rp_id) {
    return errorFormAction({
      message: "Failed to prepare app for action creation",
      additionalInfo: { app_id },
      logLevel: "error",
    });
  }

  // 2. Validate input
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

  // 3. Insert action_v4
  try {
    const { insert_action_v4_one } = await insertActionV4Sdk(
      client,
    ).InsertActionV4({
      object: {
        rp_id,
        action: parsedParams.action,
        description: parsedParams.description || "",
        environment: "production",
      },
    });

    logPortalEvent({
      event: "action_creation",
      actor: "human",
      app_id,
      action: parsedParams.action,
      metadata: { action_version: "v4", environment: "production" },
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
