"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
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
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInput } = await validateRequestSchema({
      schema,
      value: input,
    });

    if (!isValid || !parsedInput) {
      throw new Error("Invalid input");
    }

    const client = await getAPIServiceGraphqlClient();
    await getUpdateAppSdk(client).UpdateAppInfo({
      app_metadata_id,
      input: parsedInput,
    });
  } catch (error) {
    return errorFormAction({
      message: "Error updating app configuration basic form",
      error,
      additionalInfo: { app_metadata_id, input },
    });
  }
}
