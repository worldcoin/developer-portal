import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";

import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "@/legacy/backend/utils";

import { errorHasuraQuery, errorNotAllowed } from "@/legacy/backend/errors";
import { getSdk as updateSecretSDK } from "./graphql/update-secret.generated";
import { getSdk as getMembershipSdk } from "./graphql/get-membership.generated";
import { logger } from "@/lib/logger";

/**
 * Resets the client secret for an app (OIDC)
 * @param req
 * @param res
 */
export const handleSecretReset = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  if (req.body.action?.name !== "reset_client_secret") {
    logger.error("Invalid action in _reset-client-secret", { body: req.body });
    return errorHasuraQuery({ res, req });
  }

  const user_id = req.body.session_variables["x-hasura-user-id"];
  const team_id = req.body.session_variables["x-hasura-team-id"];

  if (!user_id || !team_id) {
    return errorHasuraQuery({
      res,
      req,
      detail: "User ID and Team ID are required.",
      code: "required",
    });
  }

  if (req.body.session_variables["x-hasura-role"] === "admin") {
    logger.error("Admin not allowed to run _reset-client-client-secret", {
      body: req.body,
    });
    return errorHasuraQuery({ res, req });
  }

  const { app_id } = req.body.input || {};
  if (!app_id) {
    return errorHasuraQuery({
      res,
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
    user_id,
    team_id,
    app_id,
  });

  if (!teamMembershipQuery || !teamMembershipQuery.length) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Insufficient Permissions",
      code: "insufficient_permissions",
    });
  }

  const { secret: client_secret, hashed_secret } = generateHashedSecret(app_id);
  const { update_action: updateResponse } = await updateSecretSDK(
    client,
  ).UpdateSecret({
    app_id,
    hashed_secret,
  });

  if (!updateResponse?.affected_rows) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Failed to reset the client secret.",
      code: "update_failed",
    });
  }

  res.status(200).json({ client_secret });
};
