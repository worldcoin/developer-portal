import { runCors } from "api-helpers/cors";
import { errorNotAllowed, errorUnauthenticated } from "api-helpers/errors";
import { verifyOIDCJWT } from "api-helpers/jwts";
import { NextApiRequest, NextApiResponse } from "next";

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

  const payload = await verifyOIDCJWT(token);

  return {
    sub: payload.sub,
    "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
  };
}
