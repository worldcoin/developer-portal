import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "src/lib/logger";

export function errorResponse(
  res: NextApiResponse,
  statusCode: number,
  code: string,
  detail: string = "Something went wrong",
  attribute: string | null = null,
  req: NextApiRequest
): void {
  logger.error(detail, { req, error: { statusCode, code, detail, attribute } });
  res.status(statusCode).json({ code, detail, attribute });
}

export function errorNotAllowed(
  method: string = "",
  res: NextApiResponse,
  req: NextApiRequest
): void {
  return errorResponse(
    res,
    405,
    "method_not_allowed",
    `HTTP method '${method}' is not allowed for this endpoint.`,
    null,
    req
  );
}

type OIDCErrorParam =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "invalid_scope";

export function errorUnauthenticated(
  detail: string = "Invalid credentials.",
  res: NextApiResponse,
  req: NextApiRequest
): void {
  return errorResponse(res, 401, "unauthenticated", detail, null, req);
}

export function errorRequiredAttribute(
  attribute: string = "",
  res: NextApiResponse,
  req: NextApiRequest
): void {
  return errorResponse(
    res,
    400,
    "required",
    "This attribute is required.",
    attribute,
    req
  );
}

export function errorValidation(
  code: string,
  detail: string = "This attribute is invalid.",
  attribute: string | null,
  res: NextApiResponse,
  req: NextApiRequest
): void {
  return errorResponse(res, 400, code, detail, attribute, req);
}

export function errorOIDCResponse(
  res: NextApiResponse,
  statusCode: number,
  code: OIDCErrorParam,
  detail: string = "Something went wrong",
  attribute: string | null = null,
  req: NextApiRequest
): void {
  if (statusCode >= 400) {
    logger.error(`OIDC Error {detail}`, {
      req,
      error: { statusCode, code, detail, attribute },
    });
  }

  res.status(statusCode).json({
    code,
    detail,
    attribute,
    error: code, // OAuth 2.0 spec
    error_description: detail, // OAuth 2.0 spec
  });
}

export function errorHasuraQuery({
  res,
  code,
  detail,
  req,
}: {
  res: NextApiResponse;
  req: NextApiRequest;
  code: string;
  detail: string;
}) {
  logger.error(detail, { req, error: { code, detail } });

  return res.status(400).json({
    message: detail,
    extensions: {
      code,
    },
  });
}
