"use server";
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
    const isUserAllowedToInsertApp = await getIsUserAllowedToInsertApp();
    if (!isUserAllowedToInsertApp) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: createAppSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
    }

    const client = await getAPIServiceGraphqlClient();
    await getInsertAppSdk(client).InsertApp({
      team_id,
      name: parsedInitialValues.name,
      is_staging: parsedInitialValues.build === "staging",
      engine: parsedInitialValues.verification,
      category: parsedInitialValues.category,
      integration_url:
        parsedInitialValues.integration_url ?? "https://docs.worldcoin.org/",
      app_mode: parsedInitialValues.app_mode,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid permissions") {
      throw error;
    }

    console.log("validateAndInsertAppServerSide - error inserting app", {
      error: JSON.stringify(error),
      arguments: { initialValues, team_id },
    });
    throw error;
  }
}
