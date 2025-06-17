"use server";
import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { getIsUserAllowedToUpdateAppMetadata } from "@/lib/permissions";
import {
  extractIdsFromPath,
  formatMultipleStringInput,
  getPathFromHeaders,
} from "@/lib/utils";
import {
  updateSetupInitialSchema,
  UpdateSetupInitialSchema,
} from "../form-schema";
import { getSdk as getUpdateSetupSdk } from "../SetupForm/graphql/server/update-setup.generated";

export async function validateAndUpdateSetupServerSide(
  initialValues: UpdateSetupInitialSchema,
  app_metadata_id: string,
) {
  const path = getPathFromHeaders() || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    const isUserAllowedToUpdateAppMetadata =
      await getIsUserAllowedToUpdateAppMetadata(app_metadata_id);
    if (!isUserAllowedToUpdateAppMetadata) {
      errorFormAction({
        message: "validateAndUpdateSetupServerSide - invalid permissions",
        team_id: teamId,
        app_id: appId,
      });
    }

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateSetupInitialSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      errorFormAction({
        message: "validateAndUpdateSetupServerSide - invalid input",
        team_id: teamId,
        app_id: appId,
        additionalInfo: { initialValues },
      });
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

    const is_allowed_unlimited_notifications =
      parsedInitialValues.max_notifications_per_day === "unlimited";

    const max_notifications_per_day = is_allowed_unlimited_notifications
      ? 0
      : (parsedInitialValues.max_notifications_per_day as number);

    const client = await getAPIServiceGraphqlClient();
    await getUpdateSetupSdk(client).UpdateSetup({
      app_metadata_id,
      app_mode: parsedInitialValues.app_mode,
      associated_domains,
      contracts,
      permit2_tokens,
      whitelisted_addresses,
      can_import_all_contacts: parsedInitialValues.can_import_all_contacts,
      is_allowed_unlimited_notifications,
      max_notifications_per_day,
    });
  } catch (error) {
    errorFormAction({
      error: error as Error,
      message: "validateAndUpdateSetupServerSide - error updating setup",
      team_id: teamId,
      app_id: appId,
      additionalInfo: { initialValues, app_metadata_id },
    });
  }
}
