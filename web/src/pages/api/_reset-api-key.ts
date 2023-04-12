import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "src/backend/utils";
import { errorHasuraQuery, errorNotAllowed } from "../../backend/errors";

const updateAPIKeyQuery = gql`
  mutation UpdateAPIKey($key_id: String = "", $hashed_secret: String = "") {
    update_api_key(
      where: { id: { _eq: $key_id } }
      _set: { api_key: $hashed_secret }
    ) {
      affected_rows
    }
  }
`;

/**
 * Rotates a specific API key.
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

  const key_id = req.body.input.key_id;
  if (!key_id) {
    return errorHasuraQuery({
      res,
      detail: "key_id must be set.",
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

  // Generate a new API key for the given key id
  const { secret, hashed_secret } = generateHashedSecret(key_id);
  const api_key = `api_${Buffer.from(`${key_id}:${secret}`)
    .toString("base64")
    .replace(/=/g, "")}`;

  const response = await client.mutate({
    mutation: updateAPIKeyQuery,
    variables: {
      key_id,
      hashed_secret,
    },
  });

  if (!response.data.update_api_key.affected_rows) {
    return errorHasuraQuery({
      res,
      detail: "Failed to rotate the API key.",
      code: "rotate_failed",
    });
  }

  res.status(200).json({ api_key });
}
