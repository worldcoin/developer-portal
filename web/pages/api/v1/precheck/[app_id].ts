import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { canVerifyForAction } from "api-utils";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "../../../../cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "../../../../errors";

interface AppPrecheckQueryInterface {
  app: AppAttrs[];
}

interface AppAttrs {
  id: string;
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
    external_nullifier: string;
    description: string;
    name: string;
    max_verifications: number;
    max_accounts_per_user: number;
    action: string;
    redirect_url: "";
    nullifiers: Array<{
      nullifier_hash: string;
      __typename: "nullifier";
    }>;
    __typename: "action";
  }>;
  __typename: "app";
}

const appPrecheckQuery = gql`
  query AppPrecheckQuery(
    $app_id: String!
    $external_nullifier: String
    $nullifier_hash: String
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
      }
    ) {
      id
      is_staging
      is_verified
      logo_url
      name
      status
      user_interfaces
      verified_app_logo
      verified_at
      engine
      actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
        external_nullifier
        name
        max_verifications
        max_accounts_per_user
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          nullifier_hash
        }
      }
    }
  }
`;

const createActionQuery = gql`
  mutation PrecheckCreateAction(
    $app_id: String!
    $external_nullifier: String!
    $action: String!
  ) {
    insert_action_one(
      object: {
        app_id: $app_id
        external_nullifier: $external_nullifier
        action: $action
        name: ""
        description: ""
      }
    ) {
      external_nullifier
      name
      max_verifications
      max_accounts_per_user
      action
    }
  }
`;

/**
 * Fetches public metadata for an app & action.
 * Can be used to check whether a user can verify for a particular action.
 * Called by the World App before rendering proof request modals.
 * Called by the kiosk.
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
  const action = (req.body.action as string) ?? null;
  const nullifier_hash = (req.body.nullifier_hash as string) ?? "";
  const external_nullifier = (req.body.external_nullifier as string) ?? "";

  if (!external_nullifier) {
    return errorRequiredAttribute("external_nullifier", res);
  }

  const client = await getAPIServiceClient();

  // ANCHOR: Fetch app from Hasura
  const appQueryResult = await client.query<AppPrecheckQueryInterface>({
    query: appPrecheckQuery,
    variables: {
      app_id,
      external_nullifier,
      nullifier_hash,
    },
  });

  const app = appQueryResult.data.app?.[0];

  if (!app) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be inactive."
    );
  }

  // ANCHOR: If the action doesn't exist, create it
  if (!app.actions.length) {
    if (action === null) {
      return errorResponse(
        res,
        400,
        "required",
        "This attribute is required for new actions.",
        "action"
      );
    }

    const createActionResponse = await client.mutate({
      mutation: createActionQuery,
      variables: {
        app_id,
        external_nullifier,
        action,
      },
    });
    app.actions.push(createActionResponse.data.insert_action_one);
  }

  const nullifiers = app.actions[0].nullifiers;

  const response = {
    ...app,
    sign_in_with_world_id: action === "",
    user_can_verify: null as null | boolean, // By default we cannot determine if the user can verify, unless a nullifier_hash is provided; further, this is not applicable for sign in with World ID
    action: { ...app.actions[0], nullifiers: undefined },
    actions: undefined,
  };

  // ANCHOR: If a nullifier hash is provided, determine if the user can verify
  if (nullifier_hash && response.action) {
    response.user_can_verify = canVerifyForAction(
      nullifiers,
      response.action.max_verifications
    );
  }

  res.status(200).json(response);
}
