import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorUnauthenticated,
  errorValidation,
} from "api-helpers/errors";

import { gql } from "@apollo/client";
import { NextApiRequestWithBody } from "types";
import { getAPIServiceClient } from "api-helpers/graphql";
import {
  generateUserJWT,
  generateSignUpJWT,
  verifyOIDCJWT,
} from "api-helpers/jwts";
import { NextApiResponse } from "next";
import { UserModel } from "models";
import { JWTPayload } from "jose";
import { verifyLoginNonce } from "api-helpers/login-internal";

export type LoginRequestBody = {
  sign_in_with_world_id_token?: string;
};

export type LoginResponse =
  | {
      new_user: true;
      signup_token: string;
      token?: never;
    }
  | {
      new_user: false;
      signup_token?: never;
      token: string;
    };

const query = gql`
  query FindUserByWorldID($nullifier_hash: String!) {
    user(where: { world_id_nullifier: { _eq: $nullifier_hash } }) {
      id
      team_id
      world_id_nullifier
    }
  }
`;

export default async function login(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const { sign_in_with_world_id_token } = req.body;

  if (!sign_in_with_world_id_token) {
    return errorRequiredAttribute("sign_in_with_world_id_token", res);
  }

  // ANCHOR: Verify the received JWT from Sign in with World ID
  // NOTE: Normally we would call the certificates/JWKs endpoint from the IdP, but as we're the IdP, taking a shortcut
  let payload: JWTPayload | undefined;
  try {
    payload = await verifyOIDCJWT(sign_in_with_world_id_token);
  } catch (e) {
    console.error(
      "Error verifying received login JWT from Sign in with World ID",
      e
    );
  }

  if (!payload?.sub) {
    return errorUnauthenticated("Invalid or expired token.", res);
  }

  if (!payload.nonce || !verifyLoginNonce(payload.nonce as string)) {
    return errorValidation(
      "expired_request",
      "This request has expired. Please try again.",
      "nonce",
      res
    );
  }

  // ANCHOR: Check if the user has an account
  const client = await getAPIServiceClient();
  const userQueryResult = await client.query<{
    user: Array<Pick<UserModel, "id" | "world_id_nullifier" | "team_id">>;
  }>({
    query,
    variables: {
      nullifier_hash: payload.sub,
    },
  });

  const user = userQueryResult.data.user[0];

  if (!user) {
    // NOTE: User does not have an account, generate a sign up token
    const signup_token = await generateSignUpJWT(payload.sub);
    return res.status(200).json({ new_user: true, signup_token });
  }

  // NOTE: User has an account, generate a login token
  const token = await generateUserJWT(user.id, user.team_id);
  res.status(200).json({ new_user: false, token });
}
