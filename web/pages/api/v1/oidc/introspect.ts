import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorUnauthenticated,
  errorValidation,
} from "api-helpers/errors";
import { verifyOIDCJWT } from "api-helpers/jwts";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return errorValidation(
      "invalid_content_type",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      res
    );
  }

  const userToken = req.body.token;
  if (!userToken) {
    return errorRequiredAttribute("token", res);
  }

  // ANCHOR: Authenticate the request comes from the app
  const bearerToken = req.headers.authorization?.replace("Bearer ", "");

  if (!bearerToken) {
    return errorUnauthenticated(
      "Please provide your app authentication credentials.",
      res
    );
  }

  // Decode Basic bearer token
  const [clientId, clientSecret] = Buffer.from(bearerToken, "base64");

  const payload = await verifyOIDCJWT(userToken);

  return {
    sub: payload.sub,
    "https://id.worldcoin.org/beta": payload["https://id.worldcoin.org/beta"],
  };
}
