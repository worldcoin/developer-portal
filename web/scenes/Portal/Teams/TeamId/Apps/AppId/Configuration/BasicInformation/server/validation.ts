"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { schema } from "../form-schema";
import {
  getSdk as getUpdateAppSdk,
  UpdateAppInfoMutationVariables,
} from "../graphql/server/update-app.generated";

export async function validateAndSubmitServerSide(
  app_metadata_id: string,
  input: UpdateAppInfoMutationVariables["input"],
) {
  try {
    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      throw new Error("Invalid input");
    }

    const client = await getAPIServiceGraphqlClient();
    console.log(app_metadata_id, input);
    await getUpdateAppSdk(client).UpdateAppInfo({
      app_metadata_id,
      input: parsedInput,
    });
  } catch (error) {
    console.error("Error updating app configuration basic form", {
      error: JSON.stringify(error),
      arguments: { app_metadata_id, input },
    });
    throw error;
  }
}
