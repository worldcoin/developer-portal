import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceClient } from "src/backend/graphql";
import { protectInternalEndpoint } from "src/backend/utils";
import { ActionModel } from "src/lib/models";
import { errorNotAllowed } from "../../backend/errors";
import { generateExternalNullifier } from "@/lib/hashing";

/**
 * Generates the external nullifier for actions created in the Developer Portal.
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
    return errorNotAllowed(req.method, res, req);
  }

  const action = req.body.event.data.new as ActionModel;

  if (action.external_nullifier) {
    return res.status(200).json({ success: true, already_generated: true });
  }

  const external_nullifier = generateExternalNullifier(
    action.app_id,
    action.action
  ).digest;

  const mutation = gql`
    mutation ActionExternalNullifierMutation(
      $action_id: String!
      $external_nullifier: String!
    ) {
      update_action_by_pk(
        pk_columns: { id: $action_id }
        _set: { external_nullifier: $external_nullifier }
      ) {
        external_nullifier
      }
    }
  `;

  const client = await getAPIServiceClient();

  // Mutation will fail anyways if external nullifier is already set due to permissions.
  const response = await client.query({
    query: mutation,
    variables: { action_id: action.id, external_nullifier },
  });

  if (
    response.data.update_action_by_pk?.external_nullifier === external_nullifier
  ) {
    return res.status(200).json({ success: true });
  }

  res.status(500).json({ success: false, hasura_response: response });
}
