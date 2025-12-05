"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { normalizePublicKey } from "@/lib/crypto.server";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import { checkIfPartnerTeam } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { getSdk as getActionUpdatePermissionsSdk } from "../graphql/server/get-action-update-permissions.generated";
import { getSdk as getUpdateActionSdk } from "../graphql/server/update-action.generated";
import { createUpdateActionSchema, UpdateActionSchema } from "./form-schema";

export const getIsUserAllowedToUpdateAction = async (
  teamId: string,
  actionId: string,
) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getActionUpdatePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToUpdateAction({ userId, teamId, actionId });

  if (response.team.find((team) => team.id === teamId)?.memberships.length) {
    return true;
  }
  return false;
};

export async function updateActionServerSide(
  initialValues: UpdateActionSchema,
  teamId: string,
  actionId: string,
  isProduction: boolean,
): Promise<FormActionResult> {
  let appId: string | undefined;
  try {
    const path = getPathFromHeaders() || "";
    const { Apps: appIdFromPath } = extractIdsFromPath(path, ["Apps"]);
    appId = appIdFromPath;

    const isUserAllowedToUpdateAction = await getIsUserAllowedToUpdateAction(
      teamId,
      actionId,
    );
    if (!isUserAllowedToUpdateAction) {
      return errorFormAction({
        message: "The user does not have permission to update this action",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    const updateActionSchema = createUpdateActionSchema({
      isProduction,
    });

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema: updateActionSchema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      return errorFormAction({
        message: "The provided action data is invalid",
        additionalInfo: { initialValues },
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
      });
    }

    // Do not allow webhook_uri, webhook_pem, app_flow_on_complete, and post_action_deep_link_* to be set if the app is not a partner app
    if (!checkIfPartnerTeam(teamId)) {
      parsedInitialValues.webhook_uri = undefined;
      parsedInitialValues.webhook_pem = undefined;
      parsedInitialValues.app_flow_on_complete = "NONE";
      parsedInitialValues.post_action_deep_link_ios = undefined;
      parsedInitialValues.post_action_deep_link_android = undefined;
    }

    // Normalize the public key before saving
    if (parsedInitialValues.webhook_pem) {
      parsedInitialValues.webhook_pem = await normalizePublicKey(
        parsedInitialValues.webhook_pem,
      );
    }

    const client = await getAPIServiceGraphqlClient();
    const { action, ...queryParams } = parsedInitialValues;
    const result = await getUpdateActionSdk(client).UpdateAction({
      id: actionId,
      input: queryParams,
    });

    return {
      success: true,
      message: "Action updated successfully",
      action_id: result.update_action_by_pk?.id,
    };
  } catch (error) {
    return errorFormAction({
      message: "An error occurred while updating the action",
      error: error as Error,
      additionalInfo: { initialValues },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
    });
  }
}
