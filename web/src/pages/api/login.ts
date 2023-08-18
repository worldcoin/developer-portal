import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorUnauthenticated,
  errorValidation,
} from "src/backend/errors";

import { gql } from "@apollo/client";
import { JWTPayload } from "jose";
import { NextApiResponse } from "next";
import { getReturnToFromCookie, setCookie } from "src/backend/cookies";
import { getAPIServiceClient } from "src/backend/graphql";
import {
  generateSignUpJWT,
  generateUserJWT,
  verifyOIDCJWT,
} from "src/backend/jwts";
import { getDevToken, verifyLoginNonce } from "src/backend/login-internal";
import { UserModel } from "src/lib/models";
import { NextApiRequestWithBody } from "src/lib/types";
import { logger } from "src/lib/logger";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";

export type LoginRequestBody = {
  dev_login?: string;
  sign_in_with_world_id_token?: string;
};

export type LoginRequestResponse =
  | {
      new_user: true;
      email?: string;
      signup_token: string;
    }
  | {
      new_user: false;
      returnTo?: string;
    }
  | {
      code: string;
      detail: string;
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

const schema = yup.object({
  dev_login: yup.string().strict(),
  sign_in_with_world_id_token: yup.string().strict(),
});

export default async function handleLogin(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginRequestResponse>
) {
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

  const { sign_in_with_world_id_token, dev_login } = parsedParams;

  if (
    dev_login &&
    process.env.NODE_ENV !== "production" &&
    !req.url?.includes("https://developer.worldcoin.org")
  ) {
    const devToken = (await getDevToken(dev_login)) ?? null;

    const returnTo = getReturnToFromCookie(req, res);

    if (devToken?.token) {
      setCookie(
        "auth",
        { token: devToken.token },
        req,
        res,
        devToken.expiration
      );
      return res.status(200).json({ new_user: false, returnTo });
    }
    throw new Error("Error getting dev token. Do you have a user in your DB?");
  }

  if (!sign_in_with_world_id_token) {
    return errorRequiredAttribute("sign_in_with_world_id_token", res, req);
  }

  // ANCHOR: Verify the received JWT from Sign in with World ID
  // NOTE: Normally we would call the certificates/JWKs endpoint from the IdP, but as we're the IdP, taking a shortcut
  let payload: JWTPayload | undefined;
  try {
    payload = await verifyOIDCJWT(sign_in_with_world_id_token);
  } catch (error) {
    logger.error(
      "Error verifying received login JWT from Sign in with World ID",
      { error, req }
    );
  }

  if (!payload?.sub) {
    return errorUnauthenticated("Invalid or expired token.", res, req);
  }

  if (!payload.nonce || !(await verifyLoginNonce(payload.nonce as string))) {
    return errorValidation(
      "expired_request",
      "This request has expired. Please try again.",
      "nonce",
      res,
      req
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

  // NOTE: User does not have an account
  if (!user) {
    const signup_token = await generateSignUpJWT(payload.sub);
    return res.status(200).json({ new_user: true, signup_token });
  }

  const returnTo = getReturnToFromCookie(req, res);

  // NOTE: User has an account, generate a login token and authenticate
  const { token, expiration } = await generateUserJWT(user.id, user.team_id);
  setCookie("auth", { token }, req, res, expiration);
  res.status(200).json({ new_user: false, returnTo });
}
