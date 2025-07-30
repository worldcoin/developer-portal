"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToInsertApp } from "@/lib/permissions";
import { createAppSchema, CreateAppSchema } from "../form-schema";
import { getSdk as getInsertAppSdk } from "../graphql/server/insert-app.generated";

export async function validateAndInsertAppServerSide(
  initialValues: CreateAppSchema,
  team_id: string,
) {
  try {
    const isUserAllowedToInsertApp = await getIsUserAllowedToInsertApp(team_id);
    if (!isUserAllowedToInsertApp) {
      errorFormAction({
        message: "The user does not have permission to create apps",
        team_id,
        logLevel: "warn",
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: createAppSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      errorFormAction({
        message: "The provided app data is invalid",
        additionalInfo: { initialValues },
        team_id,
        logLevel: "warn",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    await getInsertAppSdk(client).InsertApp({
      team_id,
      name: parsedInitialValues.name,
      is_staging: parsedInitialValues.build === "staging",
      engine: parsedInitialValues.verification,
      category: parsedInitialValues.category,
      integration_url:
        parsedInitialValues.integration_url ?? "https://docs.world.org/",
      app_mode: parsedInitialValues.app_mode,
    });
  } catch (error) {
    errorFormAction({
      message: "An error occurred while creating the app",
      error: error as Error,
      additionalInfo: { initialValues },
      team_id,
      logLevel: "error",
    });
  }
}
