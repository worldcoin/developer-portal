import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { canVerifyForAction } from "api-utils";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "../../../../cors";
import { errorNotAllowed, errorResponse } from "../../../../errors";

interface ActionPrecheckQueryInterface {
  app: ActionAttrs[];
}

interface ActionAttrs extends Record<string, any> {
  id: string;
  is_archived: boolean;
  is_staging: boolean;
  is_verified: boolean;
  logo_url: string;
  name: string;
  status: string;
  user_interfaces: string[];
  verified_app_logo: string;
  verified_at: string | null;
  engine: "cloud" | "on-chain";
  description: string;
  actions: Array<{
    id: string;
    external_nullifier: string;
    description: string;
    name: string;
    max_verifications: 1;
    max_accounts_per_user: 1;
    raw_action: string;
    redirect_url: "";
    nullifiers: Array<{
      nullifier_hash: string;
      __typename: "nullifier";
    }>;
    __typename: "action";
  }>;

  __typename: "app";
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
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const app_id = req.query.app_id as string;
  const raw_action = (req.body.raw_action as string) ?? "";
  const nullifier_hash = (req.body.nullifier_hash as string) ?? "";

  const client = await getAPIServiceClient();

  // Fetch action from Hasura
  const query = gql`
    query AppPrecheckQuery(
      $app_id: String!
      $raw_action: String
      $nullifier_hash: String
    ) {
      app(where: { id: { _eq: $app_id }, status: { _eq: "active" } }) {
        id
        is_archived
        is_staging
        is_verified
        logo_url
        name
        status
        user_interfaces
        verified_app_logo
        verified_at
        engine
        description
        actions(
          where: {
            _or: [
              { raw_action: { _eq: $raw_action } }
              { nullifiers: { nullifier_hash: { _eq: $nullifier_hash } } }
            ]
          }
        ) {
          id
          external_nullifier
          description
          name
          max_verifications
          max_accounts_per_user
          raw_action
          redirect_url
          nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
            nullifier_hash
          }
        }
      }
    }
  `;

  const response = await client.query<ActionPrecheckQueryInterface>({
    query,
    variables: {
      app_id,
      raw_action,
      nullifier_hash,
    },
  });

  if (!response.data.app.length) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be no longer active."
    );
  }

  console.log("response", response.data);
  const app = response.data.app[0];

  // `can_verify` is `null` if a `nullifier_hash` was not provided as we can't determine if the person can be verified.
  app.can_verify = null;
  const action = app.actions[0];
  const nullifiers = action?.nullifiers;

  if (nullifier_hash && action && nullifiers?.length !== 0) {
    app.can_verify = canVerifyForAction(
      nullifiers,
      action.max_accounts_per_user
    );
  }

  res.status(200).json(app);
}
