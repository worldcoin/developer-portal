import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { errorNotAllowed } from "../../errors";
import { protectInternalEndpoint } from "api-utils";
import { getAPIServiceClient } from "api-graphql";
import { utils } from "@worldcoin/id";
import { ActionType } from "types";
import { defaultAbiCoder as abi } from "@ethersproject/abi";

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
    return errorNotAllowed(req.method, res);
  }

  const action = req.body.event.data.new as ActionType;

  if (action.external_nullifier) {
    return res.status(200).json({ success: true, already_generated: true });
  }

  const hashedAction = utils.worldIDHash(action.action).hash;
  const hashedAppId = utils.worldIDHash(action.id).hash;
  const external_nullifier = abi.encode(
    ["uint256", "uint256"],
    [hashedAppId, hashedAction]
  );

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

  const response = await client.query({
    query: mutation,
    variables: { action_id: action.id, external_nullifier },
  });

  if (
    response.data.update_action_by_pk?.external_nullifier === external_nullifier
  ) {
    res.status(200).json({ success: true });
  }

  res.status(500).json({ success: false, hasura_response: response });
}
