import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { errorValidation, ErrorResponseBody } from "./errors";

type ParseRequestBodyResult<T> =
  | { isValid: true; body: T; error?: never }
  | { isValid: false; body?: never; error: NextResponse<ErrorResponseBody> };

/**
 * Parses the JSON body of a request and returns a 400 response if it is missing
 * or malformed, instead of letting `req.json()` throw and surface as a 500.
 */
export const parseRequestBody = async <T = unknown>(
  req: NextRequest,
  options?: { app_id?: string },
): Promise<ParseRequestBodyResult<T>> => {
  try {
    const body = (await req.json()) as T;
    return { isValid: true, body };
  } catch {
    return {
      isValid: false,
      error: errorValidation(
        "invalid_json",
        "Request body must be valid JSON.",
        null,
        req,
        options?.app_id,
      ),
    };
  }
};
