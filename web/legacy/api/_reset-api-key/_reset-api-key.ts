import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "@/legacy/backend/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "../../backend/errors";
import { getSdk as checkUserPermissions } from "./graphql/check-user-permission.generated";
import { getSdk as updateAPIKey } from "./graphql/update-api-key.generated";

/**
 * Rotates a specific API key.
 * @param req
 * @param res
 */
export default async function handleAPIKeyReset(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  if (req.body.action?.name !== "reset_api_key") {
    return errorHasuraQuery({
      res,
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const id = req.body.input.id;
  const teamId = req.body.input.team_id;

  if (!id) {
    return errorHasuraQuery({
      res,
      req,
      detail: "id must be set.",
      code: "required",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  if (req.body.session_variables["x-hasura-role"] === "admin") {
    return errorHasuraQuery({
      res,
      req,
      detail: "Admin is not allowed to run this query.",
      code: "admin_not_allowed",
    });
  }

  // Check user role
  const userId = req.body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      res,
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  if (!teamId) {
    return errorHasuraQuery({
      res,
      req,
      detail: "teamId must be set.",
      code: "required",
    });
  }

  const { team: userTeam } = await checkUserPermissions(
    client,
  ).CheckUserPermission({
    id: id,
    team_id: teamId,
    user_id: userId,
  });

  if (!userTeam || !userTeam.length) {
    return errorHasuraQuery({
      res,
      req,
      detail: "User does not have sufficient permissions.",
      code: "no_permission",
    });
  }

  // Generate a new API key for the given key id
  const { secret, hashed_secret } = generateHashedSecret(id);
  const api_key = `api_${Buffer.from(`${id}:${secret}`)
    .toString("base64")
    .replace(/=/g, "")}`;

  const { update_api_key } = await updateAPIKey(client).UpdateAPIKey({
    id,
    hashed_secret,
  });

  if (!update_api_key || !update_api_key.affected_rows) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Failed to rotate the API key.",
      code: "rotate_failed",
    });
  }

  res.status(200).json({ api_key });
}
