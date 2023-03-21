import { NextApiRequest, NextApiResponse } from "next";
import { generateInviteJWT } from "src/backend/jwts";
import { protectInternalEndpoint } from "src/backend/utils";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "../../backend/errors";

/**
 * Generates an new invite token to the developer portal
 * @param req
 * @param res
 */
export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res);
  }

  for (const attr of ["email"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  const token = await generateInviteJWT(req.body.email);
  const invite = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`;

  if (!invite) {
    return errorResponse(res, 500, "Failed to generate invite token");
  }

  res.status(200).json({ invite, token });
}
