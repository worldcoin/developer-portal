import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "src/backend/errors";

import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "src/backend/cookies";
import { verifyInviteJWT } from "src/backend/jwts";

export type InviteResponse = { returnTo: string };

export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse<InviteResponse>
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["invite_token"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const { invite_token } = req.body;
  const email = await verifyInviteJWT(invite_token);
  if (!email) {
    return errorResponse(res, 400, "Invalid invite token.");
  }

  setCookie("invite", { invite_token }, req, res);

  res.status(204).end();
}
