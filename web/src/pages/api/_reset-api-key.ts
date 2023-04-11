import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { generateOIDCSecret } from "src/backend/oidc";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "src/backend/utils";
import { errorHasuraQuery, errorNotAllowed } from "../../backend/errors";

const updateAPIKeysQuery = gql`
  mutation UpdateAPIKeys($team_id: String = "", $api_key: String = "") {
    update_api_key(
      where: { team_id: { _eq: $team_id } }
      _set: { is_active: false }
    ) {
      returning {
        id
        team_id
        is_active
      }
    }
  }
`;

const insertAPIKeyQuery = gql`
  mutation InsertAPIKey($team_id: String = "", $hashed_secret: String = "") {
    insert_api_key_one(
      object: { team_id: $team_id, api_key: $hashed_secret, is_active: true }
    ) {
      id
      team_id
      created_at
    }
  }
`;

/**
 * Resets the client secret for an app (OIDC)
 * @param req
 * @param res
 */
export default async function handleAPIKeyReset(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  if (req.body.action?.name !== "reset_api_key") {
    return errorHasuraQuery({
      res,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const team_id = req.body.session_variables["x-hasura-team-id"];
  if (!team_id) {
    return errorHasuraQuery({
      res,
      detail: "x-hasura-team-id must be set.",
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

  // Disable all other active team API keys
  await client.mutate({
    mutation: updateAPIKeysQuery,
    variables: {
      team_id,
    },
  });

  // Generate a new API key for the given team
  const { secret: api_key, hashed_secret } = generateHashedSecret(team_id);

  const response = await client.mutate({
    mutation: insertAPIKeyQuery,
    variables: {
      team_id,
      hashed_secret,
    },
  });

  if (!response.data.insert_api_key_one) {
    return errorHasuraQuery({
      res,
      detail: "Failed to insert the API key.",
      code: "insert_failed",
    });
  }

  res.status(200).json({ api_key });
}
