import { runCors } from "@/legacy/backend/cors";
import { errorNotAllowed, errorUnauthenticated } from "@/legacy/backend/errors";
import { verifyOIDCJWT } from "@/legacy/backend/jwts";
import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse } from "@/legacy/backend/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runCors(req, res);

  if (!req.method || !["GET", "POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const authorization = req.headers.authorization;
  if (!authorization) {
    return errorUnauthenticated("Missing credentials.", res, req);
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = await verifyOIDCJWT(token);
    const response: Record<string, any> = {
      sub: payload.sub,
      "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
      "https://id.worldcoin.org/v1": payload["https://id.worldcoin.org/v1"],
    };
    const scopes = (payload.scope as string)?.toString().split(" ");

    if (scopes?.includes("email")) {
      response.email = `${payload.sub}@id.worldcoin.org`;
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
      "token",
      req,
    );
  }
}
