import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getAPIServiceClient,
  getAPIServiceGraphqlClient,
} from "src/backend/graphql";

import {
  generateHashedSecret,
  protectInternalEndpoint,
} from "src/backend/utils";

import { errorHasuraQuery, errorNotAllowed } from "@/backend/errors";

import { getSdk as getMembershipSdk } from "./graphql/get-membership.generated";
import { Role_Enum } from "@/graphql/graphql";

/**
 * Resets the client secret for an app (OIDC)
 * @param req
 * @param res
 */
export const handleSecretReset = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  const user_id = req.body.session_variables["x-hasura-user-id"];
  const team_id = req.body.session_variables["x-hasura-team-id"];

  if (!user_id || !team_id) {
    return errorHasuraQuery({
      res,
      req,
      detail: "User ID and Team ID are required.",
      code: "required",
    });
  }

  const gqlClient = await getAPIServiceGraphqlClient();

  const data = await getMembershipSdk(gqlClient).GetMembership({
    user_id,
    team_id,
  });

  if (!data.membership.length) {
    return errorHasuraQuery({
      res,
      req,
      detail: "User is not a member of this team.",
      code: "invalid_membership",
    });
  }

  const user = data.membership[0];

  if (user.role !== Role_Enum.Owner && user.role !== Role_Enum.Admin) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Invalid User",
      code: "invalid_role",
    });
  }

  if (req.body.action?.name !== "reset_client_secret") {
    return errorHasuraQuery({
      res,
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const { app_id } = req.body.input || {};
  if (!app_id) {
    return errorHasuraQuery({
      res,
      req,
      detail: "`app_id` is a required input.",
      code: "required",
    });
  }

  const client = await getAPIServiceClient();

  if (req.body.session_variables["x-hasura-role"] === "admin") {
    return errorHasuraQuery({
      res,
      req,
      detail: "Admin is not allowed to run this query.",
      code: "admin_not_allowed",
    });
  }

  // ANCHOR: Make sure the user can perform this client reset
  const query = gql`
    query GetAppTeam($app_id: String!, $team_id: String!) {
      app(where: { id: { _eq: $app_id }, team_id: { _eq: $team_id } }) {
        id
      }
    }
  `;

  const appQuery = await client.query({
    query,
    variables: {
      app_id,
      team_id,
    },
  });

  if (!appQuery.data.app?.length) {
    return errorHasuraQuery({
      res,
      req,
      detail: "App ID is invalid.",
      code: "invalid_app_id",
    });
  }

  const { secret: client_secret, hashed_secret } = generateHashedSecret(app_id);

  const mutation = gql`
    mutation UpdateSecret($app_id: String!, $hashed_secret: String!) {
      update_action(
        where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
        _set: { client_secret: $hashed_secret }
      ) {
        affected_rows
      }
    }
  `;

  const response = await client.mutate({
    mutation,
    variables: {
      app_id,
      hashed_secret,
    },
  });

  if (!response.data.update_action.affected_rows) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Failed to reset the client secret.",
      code: "update_failed",
    });
  }

  res.status(200).json({ client_secret });
};
