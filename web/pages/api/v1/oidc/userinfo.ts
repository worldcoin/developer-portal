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

  // FIXME: remove
  console.log("Starting /userinfo endpoint");
  console.log(req.body);

  try {
    const payload = await verifyOIDCJWT(token); // TODO: @igorosip0v Add test for expired tokens, invalid tokens, ...
    const response: Record<string, any> = {
      sub: payload.sub,
      "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
    };
    const scopes = payload.scope?.toString().split(" ");

    if (scopes?.includes("email")) {
      response.email = "testemail@example.com";
    }

    if (scopes?.includes("profile")) {
      response.name = "World ID User";
      response.given_name = "World ID";
      response.family_name = "User";
    }

    return res.status(200).json(response);
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
