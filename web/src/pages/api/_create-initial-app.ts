import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { protectInternalEndpoint } from "src/backend/utils";

/**
 * Creates initial team for the new team in the Developer Portal.
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

  const team_id = req.body.event.data.new.id;

  if (!team_id) {
    return errorResponse(res, 500, "missing_team_id", "Missing team ID");
  }

  const mutation = gql`
    mutation CreateInitialApp($team_id: String!) {
      insert_app_one(
        object: {
          team_id: $team_id
          name: "My First App"
          is_staging: true
          engine: "cloud"
        }
      ) {
        id
      }
    }
  `;

  const client = await getAPIServiceClient();

  const response = await client.query({
    query: mutation,
    variables: { team_id },
  });

  if (response.data.insert_app_one?.id) {
    return res.status(200).json({ success: true });
  }

  res.status(500).json({ success: false, hasura_response: response });
}
