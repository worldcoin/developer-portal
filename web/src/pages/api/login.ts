import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorUnauthenticated,
  errorValidation,
} from "src/backend/errors";

import { gql } from "@apollo/client";
import { NextApiRequestWithBody } from "src/lib/types";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  generateUserJWT,
  generateSignUpJWT,
  verifyOIDCJWT,
} from "src/backend/jwts";
import { NextApiResponse } from "next";
import { UserModel } from "src/lib/models";
import { JWTPayload } from "jose";
import { getDevToken, verifyLoginNonce } from "src/backend/login-internal";
import { setCookie } from "src/backend/cookies";

export type LoginRequestBody = {
  dev_login?: string;
  sign_in_with_world_id_token?: string;
};

export type LoginRequestResponse =
  | {
      new_user: true;
      signup_token: string;
    }
  | {
      new_user: false;
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

export default async function handleLogin(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginRequestResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const { sign_in_with_world_id_token, dev_login } = req.body;

  if (
    dev_login &&
    process.env.NODE_ENV !== "production" &&
    !req.url?.includes("https://developer.worldcoin.org")
  ) {
    const devToken = (await getDevToken()) ?? null;
    if (devToken?.token) {
      setCookie(
        "auth",
        { token: devToken.token },
        req,
        res,
        devToken.expiration
      );
      return res.status(200).json({ new_user: false });
    }
  }

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

  // NOTE: User has an account, generate a login token and authenticate
  const { token, expiration } = await generateUserJWT(user.id, user.team_id);
  setCookie("auth", { token }, req, res, expiration);
  res.status(200).json({ new_user: false });
}
