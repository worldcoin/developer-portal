import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-helpers/graphql";
import { generateOIDCSecret } from "api-helpers/oidc";
import { protectInternalEndpoint } from "api-helpers/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "../../api-helpers/errors";

/**
 * Resets the client secret for an app (OIDC)
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  if (req.body.action?.name !== "reset_client_secret") {
    return errorHasuraQuery({
      res,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const { app_id } = req.body.input || {};
  if (!app_id) {
    return errorHasuraQuery({
      res,
      detail: "`app_id` is a required input.",
      code: "required",
    });
  }

  const client = await getAPIServiceClient();

  if (req.body.session_variables["x-hasura-role"] === "admin") {
    return errorHasuraQuery({
      res,
      detail: "Admin is not allowed to run this query.",
      code: "admin_not_allowed",
    });
  }

  // ANCHOR: Make sure the user can perform this client reset
  const query = gql`
    query GetAppTeam($app_id: String!, $team_id: String!) {
      app(where: { id: { _eq: $app_id }, team_id: { _eq: $team_id } }) {
        id
      }
    }
  `;

  const appQuery = await client.query({
    query,
    variables: {
      app_id,
      team_id: req.body.session_variables["x-hasura-team-id"] ?? "",
    },
  });

  if (!appQuery.data.app?.length) {
    return errorHasuraQuery({
      res,
      detail: "App ID is invalid.",
      code: "invalid_app_id",
    });
  }

  // Maybe verify the user has permission to reset the client secret?

  const { client_secret, hashed_secret } = generateOIDCSecret(app_id);

  const mutation = gql`
    mutation UpdateSecret($app_id: String!, $hashed_secret: String!) {
      update_action(
        where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
        _set: { client_secret: $hashed_secret }
      ) {
        affected_rows
      }
    }
  `;

  const response = await client.mutate({
    mutation,
    variables: {
      app_id,
      hashed_secret,
    },
  });

  if (!response.data.update_action.affected_rows) {
    return errorHasuraQuery({
      res,
      detail: "Failed to reset the client secret.",
      code: "update_failed",
    });
  }

  res.status(200).json({ client_secret });
}
