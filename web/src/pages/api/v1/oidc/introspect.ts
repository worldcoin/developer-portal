import {
  errorNotAllowed,
  errorResponse,
  errorUnauthenticated,
  errorValidation,
} from "src/backend/errors";
import { verifyOIDCJWT } from "src/backend/jwts";
import { authenticateOIDCEndpoint } from "src/backend/oidc";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";

const schema = yup.object({
  token: yup.string().required("This attribute is required."),
});

type Body = yup.InferType<typeof schema>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return errorValidation(
      "invalid_content_type",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      res,
      req
    );
  }

  const { isValid, parsedParams } = await validateRequestSchema<Body>({
    req,
    res,
    schema,
  });

  if (!isValid || !parsedParams) {
    return;
  }

  const userToken = parsedParams.token;

  // ANCHOR: Authenticate the request comes from the app
  const authToken = req.headers.authorization;

  if (!authToken) {
    return errorUnauthenticated(
      "Please provide your app authentication credentials.",
      res,
      req
    );
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authToken);

  if (!app_id) {
    return errorUnauthenticated(
      "Invalid authentication credentials.",
      res,
      req
    );
  }

  try {
    const payload = await verifyOIDCJWT(userToken);

    return res.status(200).json({
      active: true,
      client_id: app_id,
      exp: payload.exp,
      sub: payload.sub,
    });
  } catch {
    return errorResponse(
      res,
      401,
      "invalid_token",
      "Token is invalid or expired.",
      "token",
      req
    );
  }
}
