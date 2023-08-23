import { ApolloError, gql } from "@apollo/client";
import { getAPIServiceClient } from "src/backend/graphql";
import { canVerifyForAction, validateRequestSchema } from "src/backend/utils";
import { ActionModel, AppModel, NullifierModel } from "src/lib/models";
import { NextApiRequest, NextApiResponse } from "next";
import { CanUserVerifyType, EngineType } from "src/lib/types";
import { runCors } from "src/backend/cors";
import { errorNotAllowed, errorResponse } from "src/backend/errors";
import * as yup from "yup";

type _Nullifier = Pick<
  NullifierModel,
  "nullifier_hash" | "uses" | "__typename"
>;
interface _Action
  extends Pick<
    ActionModel,
    | "name"
    | "description"
    | "max_verifications"
    | "max_accounts_per_user"
    | "action"
    | "external_nullifier"
    | "status"
    | "__typename"
  > {
  nullifiers: [_Nullifier] | [];
}

interface _App
  extends Pick<
    AppModel,
    | "__typename"
    | "id"
    | "engine"
    | "is_staging"
    | "is_verified"
    | "name"
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
      name
      verified_app_logo
      engine
      actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
        external_nullifier
        name
        action
        description
        max_verifications
        max_accounts_per_user
        status
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          uses
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

const schema = yup.object({
  action: yup.string().strict(),
  nullifier_hash: yup.string().default(""),
  external_nullifier: yup
    .string()
    .strict()
    .required("This attribute is required."),
});

/**
 * Fetches public metadata for an app & action.
 * Can be used to check whether a user can verify for a particular action.
 * Called by the World App before rendering proof request modals.
 * Called by the kiosk.
 * This endpoint is publicly available.
 * @param req
 * @param res
 */
export default async function handlePrecheck(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const app_id = req.query.app_id as string;
  const action = parsedParams.action ?? null;
  const nullifier_hash = parsedParams.nullifier_hash;
  const external_nullifier = parsedParams.external_nullifier;

  const client = await getAPIServiceClient();

  // ANCHOR: Fetch app from Hasura
  const appQueryResult = await client.query<AppPrecheckQueryInterface>({
    query: appPrecheckQuery,
    variables: {
      app_id,
      nullifier_hash,
      external_nullifier,
    },
  });

  const app = appQueryResult.data.app?.[0];

  if (!app) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be inactive.",
      null,
      req
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
        "action",
        req
      );
    }

    try {
      const createActionResponse = await client.mutate({
        mutation: createActionQuery,
        variables: {
          app_id,
          action,
          external_nullifier,
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
          "external_nullifier",
          req
        );
      }
    }
  }

  const actionItem = app.actions[0];

  if (actionItem.status === "inactive") {
    return errorResponse(
      res,
      400,
      "action_inactive",
      "This action is inactive.",
      "status",
      req
    );
  }

  const nullifier = actionItem.nullifiers?.[0];

  const response = {
    ...app,
    actions: undefined,
    sign_in_with_world_id: action === "",
    action: { ...actionItem, nullifiers: undefined },
    can_user_verify: CanUserVerifyType.Undetermined, // Provides mobile app information on whether to allow the user to verify. By default we cannot determine if the user can verify unless conditions are met.
  };

  if (app.engine === EngineType.OnChain) {
    // On-chain actions uniqueness cannot be verified in the Developer Portal
    response.can_user_verify = CanUserVerifyType.OnChain;
  } else {
    if (response.sign_in_with_world_id) {
      // User can always verify for sign in with World ID
      response.can_user_verify = CanUserVerifyType.Yes;
    }

    // ANCHOR: If a nullifier hash is provided, determine if the user can verify
    if (nullifier_hash && response.action) {
      response.can_user_verify = canVerifyForAction(
        nullifier,
        response.action.max_verifications
      )
        ? CanUserVerifyType.Yes
        : CanUserVerifyType.No;
    }
  }

  res.status(200).json(response);
}
