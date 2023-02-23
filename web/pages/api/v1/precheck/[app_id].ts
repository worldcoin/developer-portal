import { ApolloError, gql } from "@apollo/client";
import { getAPIServiceClient } from "api-helpers/graphql";
import { canVerifyForAction } from "api-helpers/utils";
import { ActionModel, AppModel, NullifierModel } from "models";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "../../../../api-helpers/cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "../../../../api-helpers/errors";

type _Nullifier = Pick<NullifierModel, "nullifier_hash" | "__typename">;
interface _Action
  extends Pick<
    ActionModel,
    | "name"
    | "description"
    | "max_verifications"
    | "max_accounts_per_user"
    | "action"
    | "external_nullifier"
    | "__typename"
  > {
  nullifiers: _Nullifier[];
}

interface _App
  extends Pick<
    AppModel,
    | "__typename"
    | "id"
    | "engine"
    | "is_staging"
    | "is_verified"
    | "logo_url"
    | "name"
    | "user_interfaces"
    | "verified_at"
    | "verified_app_logo"
  > {
  actions: _Action[];
}

interface AppPrecheckQueryInterface {
  app: _App[];
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
      user_interfaces
      verified_app_logo
      verified_at
      engine
      actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
        external_nullifier
        name
        description
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
        creation_mode: "dynamic"
      }
    ) {
      external_nullifier
      name
      description
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

    try {
      const createActionResponse = await client.mutate({
        mutation: createActionQuery,
        variables: {
          app_id,
          external_nullifier,
          action,
        },
        errorPolicy: "none",
      });
      app.actions.push(createActionResponse.data.insert_action_one);
    } catch (e) {
      const error = e as ApolloError;
      if (
        error.graphQLErrors?.[0]?.extensions?.code === "constraint-violation"
      ) {
        return errorResponse(
          res,
          400,
          "external_nullifier_mismatch",
          "This action already exists but the external nullifier does not match. Please send the correct external nullifier and action.",
          "external_nullifier"
        );
      }
    }
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
