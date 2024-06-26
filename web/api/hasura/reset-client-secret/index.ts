import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getMembershipSdk } from "./graphql/get-membership.generated";
import { getSdk as updateSecretSDK } from "./graphql/update-secret.generated";

export const POST = async (req: NextRequest) => {
  if (!protectInternalEndpoint(req)) {
    return;
  }
  const body = await req.json();

  if (body?.action.name !== "reset_client_secret") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (body.session_variables["x-hasura-role"] === "admin") {
    logger.error("Admin not allowed to run _reset-client-client-secret"),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ req });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const teamId = body.input.team_id;
  if (!teamId) {
    return errorHasuraQuery({
      req,
      detail: "teamId must be set.",
      code: "required",
    });
  }

  const appId = body.input.app_id;
  if (!appId) {
    return errorHasuraQuery({
      req,
      detail: "`app_id` is a required input.",
      code: "required",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  // ANCHOR: Make sure the user can perform this client reset
  const { team: teamMembershipQuery } = await getMembershipSdk(
    client,
  ).GetMembership({
    user_id: userId,
    team_id: teamId,
    app_id: appId,
  });

  if (!teamMembershipQuery || !teamMembershipQuery.length) {
    return errorHasuraQuery({
      req,
      detail: "Insufficient Permissions",
      code: "insufficient_permissions",
    });
  }

  const { secret: client_secret, hashed_secret } = generateHashedSecret(appId);
  const { update_action: updateResponse } = await updateSecretSDK(
    client,
  ).UpdateSecret({
    app_id: appId,
    hashed_secret,
  });

  if (!updateResponse?.affected_rows) {
    return errorHasuraQuery({
      req,
      detail: "Failed to reset the client secret.",
      code: "update_failed",
    });
  }
  return NextResponse.json({ client_secret });
};
