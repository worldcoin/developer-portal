"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { normalizePublicKey } from "@/lib/crypto.server";
import { generateExternalNullifier } from "@/lib/hashing";
import { checkIfPartnerTeam } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { getSdk as getActionInsertPermissionsSdk } from "../graphql/server/get-action-insert-permissions.generated";
import { getSdk as getCreateActionSdk } from "../graphql/server/insert-action.generated";
import { createActionSchema, CreateActionSchema } from "./form-schema";

export const getIsUserAllowedToInsertAction = async (teamId: string) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getActionInsertPermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToInsertAction({ userId, teamId });

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
  if (!(await getIsUserAllowedToInsertAction(teamId))) {
    throw new Error("User is not authorized to insert action");
  }

  const schema = createActionSchema({ is_not_production: isNotProduction });

  const { isValid, parsedParams: parsedInitialValues } =
    await validateRequestSchema({
      schema,
      value: initialValues,
    });

  if (!isValid || !parsedInitialValues) {
    throw new Error("Invalid request");
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
}
