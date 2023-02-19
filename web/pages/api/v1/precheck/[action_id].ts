import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { canVerifyForAction } from "api-utils";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "../../../../cors";
import { errorNotAllowed, errorResponse } from "../../../../errors";

interface ActionPrecheckQueryInterface {
  action: ActionAttrs[];
}

interface ActionAttrs extends Record<string, any> {
  id: string;
  public_description: string;
  name: string;
  is_staging: boolean;
  engine: "cloud" | "on-chain";
  return_url: string;
  max_verifications_per_person: number;
  can_verify?: boolean | null;
  app: {
    name: string;
    is_verified: boolean;
    verified_app_logo: string;
    __typename: "app";
  };
  nullifiers: Array<{
    nullifier_hash: string;
  }>;
  __typename: "action";
}

/**
 * Fetches public metadata for an action. Used to render hosted & kiosk pages.
 * This endpoint is publicly available.
 * @param req
 * @param res
 */
export default async function handleVerifyPrecheck(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const action_id = req.query.action_id as string;
  const nullifier_hash = (req.query.nullifier_hash as string) ?? "";

  const client = await getAPIServiceClient();

  // Fetch action from Hasura
  const query = gql`
    query ActionPrecheckQuery($action_id: String!, $nullifier_hash: String) {
      action(
        where: {
          _or: [{ id: { _eq: $action_id } }, { hashed_id: { _eq: $action_id } }]
          status: { _eq: "active" }
        }
        limit: 1
      ) {
        id
        public_description
        name
        is_staging
        engine
        return_url
        max_verifications_per_person
        app {
          name
          is_verified
          verified_app_logo
        }
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          nullifier_hash
        }
      }
    }
  `;

  const response = await client.query<ActionPrecheckQueryInterface>({
    query,
    variables: {
      action_id,
      nullifier_hash,
    },
  });

  if (!response.data.action.length) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an action with this ID. Action may be no longer active."
    );
  }

  const action = response.data.action[0];
  // `can_verify` is `null` if a `nullifier_hash` was not provided as we can't determine if the person can be verified.
  action.can_verify = null;
  if (nullifier_hash) {
    action.can_verify = canVerifyForAction(
      action.nullifiers,
      action.max_verifications_per_person
    );
  }

  // TODO: Temporary workaround for mobile apps (version 1.1.5 and below)
  action.team = {
    ...action.app,
    app_name: action.app.name,
    __typename: "team",
  };

  res.status(200).json(action);
}
