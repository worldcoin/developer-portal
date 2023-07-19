import { NextApiRequestWithBody } from "@/lib/types";
import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorUnauthenticated,
  errorValidation,
} from "@/backend/errors";
import { JWTPayload } from "jose";
import { generateUserJWT, verifyOIDCJWT } from "@/backend/jwts";
import { verifyLoginNonce } from "@/backend/login-internal";
import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk as findUserByNullifierSdk } from "@/api/login-with-invite/graphql/findUserByNullifier.generated";
import { getSdk as getInviteByIdSdk } from "@/api/login-with-invite/graphql/getInviteById.generated";
import { getSdk as createUserAndDeleteInviteSdk } from "@/api/login-with-invite/graphql/createUserAndDeleteInvite.generated";
import { setCookie } from "@/backend/cookies";

export type LoginRequestBody = {
  sign_in_with_world_id_token?: string;
  invite_id?: string;
};

export type LoginRequestResponse = {};

export default async function handleLogin(
  req: NextApiRequestWithBody<LoginRequestBody>,
  res: NextApiResponse<LoginRequestResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method!, res, req);
  }

  const { sign_in_with_world_id_token, invite_id } = req.body;

  if (!sign_in_with_world_id_token) {
    return errorRequiredAttribute("sign_in_with_world_id_token", res, req);
  }

  if (!invite_id) {
    return errorRequiredAttribute("invite_id", res, req);
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
  setCookie("auth", { token }, req as NextApiRequest, res, expiration);
  res.status(200).json({});
}
