import { NextApiRequest, NextApiResponse } from "next";
import { generateInviteJWT } from "src/backend/jwts";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "../../backend/errors";

// FIXME: @igorosip0v, @paolodamico this is work handler?
/**
 * Generates an new invite token to the Developer Portal
 * @param req
 * @param res
 */
export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    !process.env.INVITE_CODES_TOKEN ||
    req.headers.authorization?.replace("Bearer ", "") !==
      process.env.INVITE_CODES_TOKEN
  ) {
    return res.status(403).json({
      code: "permission_denied",
      detail: "You do not have permission to perform this action.",
      attr: null,
    });
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return errorResponse(
      res,
      500,
      "error_next_app_url",
      "NEXT_PUBLIC_APP_URL env is not defined",
      null,
      req
    );
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method, res, req);
  }

  for (const attr of ["email"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res, req);
    }
  }

  const token = await generateInviteJWT(req.body.email);

  if (!token) {
    return errorResponse(
      res,
      500,
      "error_invite_token",
      "Failed to generate invite token",
      null,
      req
    );
  }

  const invite = new URL(
    `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`
  );

  res.status(200).json({ invite, token });
}
