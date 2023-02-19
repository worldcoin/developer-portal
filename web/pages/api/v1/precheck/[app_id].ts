import { gql } from "@apollo/client";
import { getAPIServiceClient } from "api-graphql";
import { canVerifyForAction } from "api-utils";
import { NextApiRequest, NextApiResponse } from "next";
import { runCors } from "../../../../cors";
import { errorNotAllowed, errorResponse } from "../../../../errors";

interface ActionPrecheckQueryInterface {
  app: AppAttrs[];
}

interface AppAttrs extends Record<string, any> {
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
    max_verifications: number;
    max_accounts_per_user: number;
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
  const raw_action = (req.body.action as string) ?? "";
  const nullifier_hash = (req.body.nullifier_hash as string) ?? "";
  const external_nullifier = (req.body.external_nullifier as string) ?? "";

  console.log({
    app_id,
    raw_action,
    nullifier_hash,
    external_nullifier,
  });

  if (!external_nullifier) {
    return errorResponse(
      res,
      400,
      "body_validation_error",
      "external_nullifier is required"
    );
  }

  const client = await getAPIServiceClient();

  console.log(client.mutate);

  // Fetch action from Hasura
  const appPrecheckQuery = gql`
    query AppPrecheckQuery(
      $app_id: String!
      $external_nullifier: String
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
        actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
          id
          external_nullifier
          description
          name
          max_verifications
          max_accounts_per_user
          raw_action
          nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
            nullifier_hash
          }
        }
      }
    }
  `;

  const createActionQuery = gql`
    mutation PrecheckAddAction(
      $app_id: String!
      $external_nullifier: String!
      $raw_action: String!
    ) {
      insert_action_one(
        object: {
          app_id: $app_id
          external_nullifier: $external_nullifier
          raw_action: $raw_action
          name: ""
          description: ""
        }
      ) {
        id
        external_nullifier
        max_verifications
        max_accounts_per_user
        description
        name
        app_id
      }
    }
  `;

  const fetchApp = async () => {
    let app;

    try {
      const result = await client.query<ActionPrecheckQueryInterface>({
        query: appPrecheckQuery,
        variables: {
          app_id,
          external_nullifier,
          nullifier_hash,
        },
      });

      app = result.data.app[0];
    } catch (error) {
      console.error("Error while fetching app", error);
      app = null;
    }

    return app;
  };

  let app = await fetchApp();

  console.log("app", app);

  if (app === undefined) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be no longer active."
    );
  }

  if (app === null) {
    return errorResponse(
      res,
      500,
      "internal_error",
      "Error while fetching app"
    );
  }

  // `can_verify` is `null` if a `nullifier_hash` was not provided as we can't determine if the person can be verified.
  app.can_verify = null;
  const action = app.actions[0];

  if (!action) {
    let createActionResponse;

    try {
      createActionResponse = await client.mutate({
        mutation: createActionQuery,
        variables: {
          app_id,
          external_nullifier,
          raw_action,
        },
      });
    } catch (error) {
      console.error("Error while creating action", error);

      return errorResponse(
        res,
        500,
        "internal_error",
        "Error while creating action"
      );
    }

    app = await fetchApp();

    if (!app) {
      return errorResponse(
        res,
        500,
        "internal_error",
        "Error while fetching app after creating action"
      );
    }
  }

  const nullifiers = action?.nullifiers;

  if (nullifier_hash && action && nullifiers?.length !== 0) {
    app.can_verify = canVerifyForAction(nullifiers, action.max_verifications);
  }

  res.status(200).json(app);
}
