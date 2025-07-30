"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { normalizePublicKey } from "@/lib/crypto.server";
import { generateExternalNullifier } from "@/lib/hashing";
import { checkIfPartnerTeam } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { getSdk as getActionInsertPermissionsSdk } from "../graphql/server/get-action-insert-permissions.generated";
import { getSdk as getCreateActionSdk } from "../graphql/server/insert-action.generated";
import { createActionSchema, CreateActionSchema } from "./form-schema";

export const getIsUserAllowedToInsertAction = async (
  teamId: string,
  appId: string,
) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getActionInsertPermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToInsertAction({ userId, teamId, appId });

  if (response.team.find((team) => team.id === teamId)?.memberships.length) {
    return true;
  }
  return false;
};

export async function createActionServerSide(
  initialValues: CreateActionSchema,
  teamId: string,
  appId: string,
  isNotProduction: boolean,
) {
  try {
    if (!(await getIsUserAllowedToInsertAction(teamId, appId))) {
      errorFormAction({
        message:
          "The user does not have permission to create actions for this app",
        team_id: teamId,
        app_id: appId,
      });
    }

    const schema = createActionSchema({ is_not_production: isNotProduction });

    const { isValid, parsedParams: parsedInitialValues } =
      await validateRequestSchema({
        schema,
        value: initialValues,
      });

    if (!isValid || !parsedInitialValues) {
      errorFormAction({
        message: "The provided action data is invalid",
        additionalInfo: { initialValues },
        team_id: teamId,
        app_id: appId,
      });
    }

    // Do not allow webhook_uri, webhook_pem, and app_flow_on_complete to be set if the app is not a partner app
    if (!checkIfPartnerTeam(teamId)) {
      parsedInitialValues.webhook_uri = undefined;
      parsedInitialValues.webhook_pem = undefined;
      parsedInitialValues.app_flow_on_complete = "NONE";
    }

    if (parsedInitialValues.webhook_pem) {
      parsedInitialValues.webhook_pem = await normalizePublicKey(
        parsedInitialValues.webhook_pem,
      );
    }

    const client = await getAPIServiceGraphqlClient();

    const result = await getCreateActionSdk(client).InsertAction({
      ...parsedInitialValues,
      app_id: appId,
      external_nullifier: generateExternalNullifier(
        appId,
        parsedInitialValues.action,
      ).digest,
    });

    return {
      action_id: result.insert_action_one?.id,
    };
  } catch (error) {
    errorFormAction({
      message: "An error occurred while creating the action",
      error: error as Error,
      additionalInfo: { initialValues },
      team_id: teamId,
      app_id: appId,
    });
  }
}
