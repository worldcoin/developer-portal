import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "@apollo/client";
import { errorNotAllowed } from "../../errors";
import { protectInternalEndpoint } from "api-utils";
import { getAPIServiceClient } from "api-graphql";
import { utils } from "@worldcoin/id";

/**
 * Generates the hashed action ID and stores it in the DB
 * @param req
 * @param res
 */
export default async function handleGenerateHashedActionId(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  const action_id = req.body.event.data.new.id;
  const hashed_id = utils.worldIDHash(action_id).digest;

  const mutation = gql`
    mutation HashedIDMutation($action_id: String!, $hashed_id: String!) {
      update_action_by_pk(
        pk_columns: { id: $action_id }
        _set: { hashed_id: $hashed_id }
      ) {
        hashed_id
      }
    }
  `;

  const client = await getAPIServiceClient();

  const response = await client.query({
    query: mutation,
    variables: { action_id, hashed_id },
  });

  if (response.data.update_action_by_pk?.hashed_id === hashed_id) {
    res.status(200).json({ success: true });
  }

  res.status(500).json({ success: false, hasura_response: response });
}
