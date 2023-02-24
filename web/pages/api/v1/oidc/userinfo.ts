import { runCors } from "api-helpers/cors";
import { errorNotAllowed, errorUnauthenticated } from "api-helpers/errors";
import { verifyOIDCJWT } from "api-helpers/jwts";
import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "../../../../api-helpers/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["GET", "POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const authorization = req.headers.authorization;
  if (!authorization) {
    return errorUnauthenticated("Missing credentials.", res);
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await verifyOIDCJWT(token); // TODO: @igorosip0v Add test for expired tokens, invalid tokens, ...
    return res.status(200).json({
      sub: payload.sub,
      "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
    });
  } catch {
    return errorResponse(
      res,
      401,
      "invalid_token",
      "Token is invalid or expired.",
      "token"
    );
  }
}
