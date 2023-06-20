import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "src/backend/utils";
import { errorHasuraQuery, errorNotAllowed } from "../../backend/errors";
import { APIKeyModel } from "src/lib/models";

const updateAPIKeyQuery = gql`
  mutation UpdateAPIKey($id: String = "", $hashed_secret: String = "") {
    update_api_key(
      where: { id: { _eq: $id } }
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
export default async function handleAPIKey(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  if (req.body.trigger?.name !== "generate_api_key") {
    return errorHasuraQuery({
      res,
      detail: "Invalid trigger.",
      code: "invalid_trigger",
    });
  }

  const key = req.body.event.data.new as APIKeyModel;
  if (!key.id) {
    return errorHasuraQuery({
      res,
      detail: "id must be set.",
      code: "required",
    });
  }

  const client = await getAPIServiceClient();

  // Generate a new API key for the given key id
  const { secret, hashed_secret } = generateHashedSecret(key.id);
  const api_key = `api_${Buffer.from(`${key.id}:${secret}`)
    .toString("base64")
    .replace(/=/g, "")}`;

  const response = await client.mutate({
    mutation: updateAPIKeyQuery,
    variables: {
      id: key.id,
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
