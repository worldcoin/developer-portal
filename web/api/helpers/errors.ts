import { logger } from "@/lib/logger";
import { FormActionResult } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import "server-only";

export function errorResponse(params: {
  statusCode: number;
  code: string;
  detail?: string;
  attribute?: string | null;
  req: NextRequest;
  app_id?: string;
  team_id?: string;
}) {
  const {
    statusCode,
    code,
    detail = "Something went wrong",
    attribute = null,
    req,
    app_id,
    team_id,
  } = params;

  if (statusCode >= 500) {
    logger.error(detail, {
      req,
      error: { statusCode, code, attribute },
      app_id,
      team_id,
    });
  } else {
    logger.warn(detail, {
      req,
      error: { statusCode, code, attribute },
      app_id,
      team_id,
    });
  }

  return NextResponse.json(
    { code, detail, attribute, app_id, team_id },
    { status: statusCode },
  );
}

export function errorNotAllowed(method: string = "", req: NextRequest) {
  return errorResponse({
    statusCode: 405,
    code: "method_not_allowed",
    detail: `HTTP method '${method}' is not allowed for this endpoint.`,
    attribute: null,
    req,
  });
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
  req: NextRequest,
) {
  return errorResponse({
    statusCode: 401,
    code: "unauthenticated",
    detail,
    attribute: null,
    req,
  });
}

export function errorForbidden(
  req: NextRequest,
  detail: string = "You do not have permission to perform this action.",
) {
  return errorResponse({
    statusCode: 403,
    code: "permission_denied",
    detail,
    attribute: null,
    req,
  });
}

export function errorRequiredAttribute(
  attribute: string = "",
  req: NextRequest,
  app_id?: string,
) {
  return errorResponse({
    statusCode: 400,
    code: "required",
    detail: "This attribute is required.",
    attribute,
    req,
    app_id,
  });
}

export function errorValidation(
  code: string,
  detail: string = "This attribute is invalid.",
  attribute: string | null,
  req: NextRequest,
  app_id?: string,
) {
  return errorResponse({
    statusCode: 400,
    code,
    detail,
    attribute,
    req,
    app_id,
  });
}

export function errorOIDCResponse(
  statusCode: number,
  code: OIDCErrorParam,
  detail: string = "Something went wrong",
  attribute: string | null = null,
  req: NextRequest,
  app_id?: string,
) {
  if (statusCode >= 500) {
    logger.error(`OIDC Error ${detail}`, {
      req,
      error: { statusCode, code, attribute },
      app_id,
    });
  } else {
    logger.debug(`OIDC Error ${detail}`, {
      req,
      error: { statusCode, code, attribute },
      app_id,
    });
  }

  return NextResponse.json(
    {
      code,
      detail,
      attribute,
      error: code, // OAuth 2.0 spec
      error_description: detail, // OAuth 2.0 spec
    },
    { status: statusCode },
  );
}

export function errorHasuraQuery({
  req,
  code = "internal_api_error",
  detail = "Something went wrong.",
  app_id,
  team_id,
}: {
  req: NextRequest;
  code?: string;
  detail?: string;
  app_id?: string;
  team_id?: string;
}) {
  logger.error(detail, {
    req,
    error: { code },
    app_id,
    team_id,
  });

  return NextResponse.json(
    {
      message: detail,
      extensions: {
        code,
      },
    },
    { status: 400 },
  );
}

export function errorFormAction({
  error,
  message,
  additionalInfo,
  app_id,
  team_id,
  logLevel,
}: {
  error?: Error;
  message: string;
  additionalInfo?: object;
  app_id?: string;
  team_id?: string;
  logLevel?: "error" | "warn";
}): FormActionResult {
  logger[logLevel || "error"](message, {
    error,
    additionalInfo,
    app_id,
    team_id,
  });

  return { success: false, message, error };
}
