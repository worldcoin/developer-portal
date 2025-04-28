import "server-only";

import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { errorResponse } from "./errors";

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
