"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToInsertApp } from "@/lib/permissions";
import { FormActionResult } from "@/lib/types";
import { createAppSchemaV2, CreateAppSchemaV2 } from "../form-schema-v2";
import { getSdk as getInsertAppV2Sdk } from "../graphql/server/insert-app-v2.generated";

export async function validateAndInsertAppServerSideV2(
  initialValues: CreateAppSchemaV2,
  team_id: string,
): Promise<FormActionResult> {
  try {
    const isUserAllowedToInsertApp = await getIsUserAllowedToInsertApp(team_id);
    if (!isUserAllowedToInsertApp) {
      return errorFormAction({
        message: "The user does not have permission to create apps",
        team_id,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: createAppSchemaV2,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      return errorFormAction({
        message: "The provided app data is invalid",
        additionalInfo: { initialValues },
        team_id,
        logLevel: "warn",
      });
    }

    // Additional safeguard: ensure category is provided when miniapp is enabled
    if (parsedInitialValues.is_miniapp && !parsedInitialValues.category) {
      return errorFormAction({
        message: "Category is required when miniapp is enabled",
        additionalInfo: { initialValues },
        team_id,
        logLevel: "warn",
      });
    }

    // Map is_miniapp boolean to app_mode string
    const app_mode = parsedInitialValues.is_miniapp ? "mini-app" : "external";

    const client = await getAPIServiceGraphqlClient();
    await getInsertAppV2Sdk(client).InsertAppV2({
      team_id,
      name: parsedInitialValues.name,
      is_staging: parsedInitialValues.build === "staging",
      engine: parsedInitialValues.verification,
      category: parsedInitialValues.category ?? "",
      integration_url:
        parsedInitialValues.integration_url ?? "https://docs.world.org/",
      app_mode,
    });

    return {
      success: true,
      message: "App created successfully",
    };
  } catch (error) {
    return errorFormAction({
      message: "An error occurred while creating the app",
      error: error as Error,
      additionalInfo: { initialValues },
      team_id,
      logLevel: "error",
    });
  }
}
