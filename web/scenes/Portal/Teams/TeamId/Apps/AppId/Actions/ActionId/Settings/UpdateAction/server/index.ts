"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { checkIfPartnerTeam } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { getSdk as getActionUpdatePermissionsSdk } from "../graphql/server/get-action-update-permissions.generated";
import { getSdk as getUpdateActionSdk } from "../graphql/server/update-action.generated";
import { updateActionSchema, UpdateActionSchema } from "./form-schema";

export const getIsUserAllowedToUpdateAction = async (teamId: string) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getActionUpdatePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToUpdateAction({ userId, teamId });

  if (response.team.find((team) => team.id === teamId)?.memberships.length) {
    return true;
  }
  return false;
};

export async function updateActionServerSide(
  initialValues: UpdateActionSchema,
  teamId: string,
  actionId: string,
) {
  if (!(await getIsUserAllowedToUpdateAction(teamId))) {
    throw new Error("User is not authorized to insert action");
  }

  const { isValid, parsedParams: parsedInitialValues } =
    await validateRequestSchema({
      schema: updateActionSchema,
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

  const client = await getAPIServiceGraphqlClient();
  const { action, ...queryParams } = parsedInitialValues;
  const result = await getUpdateActionSdk(client).UpdateAction({
    id: actionId,
    input: queryParams,
  });

  return {
    action_id: result.update_action_by_pk?.id,
  };
}
