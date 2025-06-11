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
        message: "validateAndInsertAppServerSide - invalid permissions",
        additionalInfo: { initialValues },
        team_id,
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: createAppSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      errorFormAction({
        message: "validateAndInsertAppServerSide - invalid input",
        additionalInfo: { initialValues },
        team_id,
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
      message: "validateAndInsertAppServerSide - error inserting app",
      error: error as Error,
      additionalInfo: { initialValues },
      team_id,
    });
  }
}
