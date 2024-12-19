"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { generateExternalNullifier } from "@/lib/hashing";
import { getSdk as getCreateActionSdk } from "../graphql/server/insert-action.generated";
import { createActionSchema, CreateActionSchema } from "./form-schema";
    
export async function createActionServerSide(
  initialValues: CreateActionSchema,
) {
  const { isValid, parsedParams: parsedInitialValues } =
    await validateRequestSchema({
      schema: createActionSchema,
      value: initialValues,
    });

  if (!isValid || !parsedInitialValues) {
    throw new Error("Invalid request");
  }

  const client = await getAPIServiceGraphqlClient();

  const result = await getCreateActionSdk(client).InsertAction({
    ...parsedInitialValues,
    external_nullifier: generateExternalNullifier(
      parsedInitialValues.app_id,
      parsedInitialValues.action,
    ).digest,
  });

  return {
    action_id: result.insert_action_one?.id,
  };
}
