import {
  errorResponse,
  errorUnauthenticated,
  errorValidation,
} from "@/api/helpers/errors";
import { verifyOIDCJWT } from "@/api/helpers/jwts";
import { authenticateOIDCEndpoint } from "@/api/helpers/oidc";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup
  .object({
    token: yup.string().strict().required("This attribute is required."),
  })
  .noUnknown();

export async function POST(req: NextRequest) {
  if (req.headers.get("content-type") !== "application/x-www-form-urlencoded") {
    return errorValidation(
      "invalid_content_type",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      req,
    );
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const userToken = parsedParams.token;

  // ANCHOR: Authenticate the request comes from the app
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return errorUnauthenticated(
      "Please provide your app authentication credentials.",
      req,
    );
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authHeader);

  if (!app_id) {
    return errorUnauthenticated("Invalid authentication credentials.", req);
  }

  try {
    const payload = await verifyOIDCJWT(userToken);

    return NextResponse.json({
      active: true,
      client_id: app_id,
      exp: payload.exp,
      sub: payload.sub,
    });
  } catch {
    return errorResponse({
      statusCode: 401,
      code: "invalid_token",
      detail: "Token is invalid or expired.",
      attribute: "token",
      req,
      app_id,
    });
  }
}
