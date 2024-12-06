"use server";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import { formatMultipleStringInput } from "@/lib/utils";
import {
  updateSetupInitialSchema,
  UpdateSetupInitialSchema,
} from "../form-schema";
import { getSdk as getUpdateSetupSdk } from "../SetupForm/graphql/server/update-setup.generated";

export async function validateAndUpdateSetupServerSide(
  initialValues: UpdateSetupInitialSchema,
  app_metadata_id: string,
) {
  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      throw new Error("Invalid permissions");
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateSetupInitialSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      throw new Error("Invalid input");
    }

    const associated_domains =
      parsedInitialValues.associated_domains &&
      parsedInitialValues.associated_domains.length > 0
        ? formatMultipleStringInput(parsedInitialValues.associated_domains)
        : null;

    const contracts =
      parsedInitialValues.contracts && parsedInitialValues.contracts.length > 0
        ? formatMultipleStringInput(parsedInitialValues.contracts)
        : null;

    const permit2_tokens =
      parsedInitialValues.permit2_tokens &&
      parsedInitialValues.permit2_tokens.length > 0
        ? formatMultipleStringInput(parsedInitialValues.permit2_tokens)
        : null;
    // If the user disabled the whitelist, we should set the whitelisted_addresses to null
    const whitelisted_addresses = parsedInitialValues.is_whitelist_disabled
      ? null
      : formatMultipleStringInput(parsedInitialValues.whitelisted_addresses);

    const client = await getAPIServiceGraphqlClient();
    await getUpdateSetupSdk(client).UpdateSetup({
      app_metadata_id,
      app_mode: parsedInitialValues.app_mode,
      associated_domains,
      contracts,
      permit2_tokens,
      whitelisted_addresses,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid permissions") {
      throw error;
    }

    console.log("validateAndUpdateSetupServerSide - error updating setup", {
      error: JSON.stringify(error),
      arguments: { initialValues, app_metadata_id },
    });
    throw error;
  }
}
