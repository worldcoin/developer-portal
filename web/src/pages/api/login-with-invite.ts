import { NextApiRequestWithBody } from "src/lib/types";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorResponse,
  errorUnauthenticated,
  errorValidation,
} from "src/backend/errors";
import { JWTPayload } from "jose";
import { generateUserJWT, verifyOIDCJWT } from "src/backend/jwts";
import { verifyLoginNonce } from "src/backend/login-internal";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { getSdk as findUserByNullifierSdk } from "src/api/login-with-invite/graphql/findUserByNullifier.generated";
import { getSdk as getInviteByIdSdk } from "src/api/login-with-invite/graphql/getInviteById.generated";
import { getSdk as createUserAndDeleteInviteSdk } from "src/api/login-with-invite/graphql/createUserAndDeleteInvite.generated";
import { setCookie } from "src/backend/cookies";
import { logger } from "src/lib/logger";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";

export type LoginRequestBody = {
  sign_in_with_world_id_token?: string;
  invite_id?: string;
};

export type LoginRequestResponse = {};

const schema = yup.object({
  invite_id: yup.string().strict().required("This attribute is required."),
  sign_in_with_world_id_token: yup
    .string()
    .strict()
    .required("This attribute is required."),
});

export default async function handleLogin(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginRequestResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method!, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const { sign_in_with_world_id_token, invite_id } = parsedParams;

  // ANCHOR: Verify the received JWT from Sign in with World ID
  // NOTE: Normally we would call the certificates/JWKs endpoint from the IdP, but as we're the IdP, taking a shortcut
  let payload: JWTPayload | undefined;
  try {
    payload = await verifyOIDCJWT(sign_in_with_world_id_token);
  } catch (error) {
    logger.error(
      "Error verifying received login JWT from Sign in with World ID",
      { error }
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

  const nullifier = payload.sub;

  const client = await getAPIServiceGraphqlClient();

  // ANCHOR: Check if the user is already in the DB
  const {
    users: [user],
  } = await findUserByNullifierSdk(client).FindUserByNullifier({
    nullifier,
  });
  if (user) {
    return errorResponse(res, 500, "user_already_exists", undefined, null, req);
  }

  // ANCHOR: If the user is not in the DB, check invite
  const { invite } = await getInviteByIdSdk(client).GetInviteById({
    id: invite_id,
  });

  if (!invite || new Date(invite.expires_at) <= new Date()) {
    return errorResponse(res, 400, "invalid_invite", undefined, null, req);
  }

  // ANCHOR: Create user and delete invite
  const { user: createdUser } = await createUserAndDeleteInviteSdk(
    client
  ).CreateUserAndDeleteInvite({
    email: invite.email,
    team_id: invite.team_id,
    ironclad_id: "", // REVIEW: How to get ironclad_id when we create user after email invite?
    nullifier,
    invite_id: invite.id,
  });

  if (!createdUser) {
    return errorResponse(res, 500, "user_not_created", undefined, null, req);
  }

  // ANCHOR: Generate a login token and authenticate
  const { token, expiration } = await generateUserJWT(
    createdUser.id,
    createdUser.team_id
  );
  setCookie("auth", { token }, req as NextApiRequest, res, expiration, "lax");
  res.status(200).json({});
}
