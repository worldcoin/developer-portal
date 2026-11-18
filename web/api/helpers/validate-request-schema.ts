import "server-only";

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { errorResponse } from "./errors";

// Yup looks up schema fields on a plain object before stripping unknown keys.
// Reject inherited field names before casting, including in nested values.
const assertSupportedPropertyNames = (value: unknown) => {
  const pending = [{ value, path: "" }];
  const visited = new WeakSet<object>();

  while (pending.length) {
    const current = pending.pop()!;
    if (
      current.value === null ||
      typeof current.value !== "object" ||
      visited.has(current.value)
    ) {
      continue;
    }
    visited.add(current.value);

    for (const key of Object.keys(current.value)) {
      const path = Array.isArray(current.value)
        ? `${current.path}[${key}]`
        : current.path
          ? `${current.path}.${key}`
          : key;

      if (Object.hasOwn(Object.prototype, key)) {
        throw new yup.ValidationError(
          "This attribute name is not supported.",
          undefined,
          path,
        );
      }
      pending.push({
        value: (current.value as Record<string, unknown>)[key],
        path,
      });
    }
  }
};

/**
 * Validate a request body against a yup schema and returns an error if applicable
 */
export const validateRequestSchema = async <T extends yup.Schema>({
  schema,
  value,
  app_id,
}: {
  schema: T;
  value: any;
  app_id?: string;
}): Promise<
  | {
      isValid: true;
      parsedParams: yup.InferType<T>;
      handleError?: never;
    }
  | {
      isValid: false;
      parsedParams?: never;
      handleError: (req: NextRequest) => NextResponse<{
        code: string;
        detail: string;
        attribute: string | null;
      }>;
    }
> => {
  let parsedParams: yup.InferType<typeof schema>;

  try {
    assertSupportedPropertyNames(value);
    parsedParams = await schema.validate(value);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const handleError = (req: NextRequest) => {
        const validationError = error as yup.ValidationError;

        return errorResponse({
          statusCode: 400,
          code: "validation_error",
          detail: validationError.message,
          attribute: validationError.path,
          req,
          app_id,
        });
      };
      return { isValid: false, handleError };
    }

    logger.error("Unexpected error validating request schema", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      app_id,
    });

    const handleError = (req: NextRequest) => {
      return errorResponse({
        statusCode: 500,
        code: "server_error",
        detail: "Something went wrong. Please try again.",
        attribute: null,
        req,
        app_id,
      });
    };

    return { isValid: false, handleError };
  }

  return { isValid: true, parsedParams };
};
