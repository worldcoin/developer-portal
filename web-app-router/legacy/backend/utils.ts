/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { errorForbidden, errorResponse, errorValidation } from "./errors";
import * as yup from "yup";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!",
  );
}

/**
 * Ensures endpoint is properly authenticated using internal token. For interactions between Hasura -> Next.js API
 * @param req
 * @param res
 * @returns
 */
export const protectInternalEndpoint = (
  req: NextApiRequest,
  res: NextApiResponse,
): boolean => {
  if (
    !process.env.INTERNAL_ENDPOINTS_SECRET ||
    req.headers.authorization?.replace("Bearer ", "") !==
      process.env.INTERNAL_ENDPOINTS_SECRET
  ) {
    errorForbidden(req, res);
    return false;
  }
  return true;
};

/**
 * Validate a request body against a yup schema and returns an error if applicable
 */
export const validateRequestSchema = async <T extends yup.Schema>({
  schema,
  value,
}: {
  schema: T;
  value: any;
}): Promise<
  | {
      isValid: true;
      parsedParams: yup.InferType<T>;
      handleError?: never;
    }
  | {
      isValid: false;
      parsedParams?: never;
      handleError: (req: NextApiRequest, res: NextApiResponse) => void;
    }
> => {
  let parsedParams: yup.InferType<typeof schema>;

  try {
    parsedParams = await schema.validate(value);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const handleError = (req: NextApiRequest, res: NextApiResponse) => {
        const validationError = error as yup.ValidationError;
        errorValidation(
          "invalid",
          validationError.message,
          validationError.path || null,
          res,
          req,
        );
      };
      return { isValid: false, handleError };
    }

    const handleError = (req: NextApiRequest, res: NextApiResponse) => {
      errorResponse(
        res,
        500,
        "server_error",
        "Something went wrong. Please try again.",
        null,
        req,
      );
    };

    return { isValid: false, handleError };
  }

  return { isValid: true, parsedParams };
};

/**
 * Checks whether the person can be verified for a particular action based on the max number of verifications
 */
export const canVerifyForAction = (
  nullifier:
    | {
        uses: number;
        nullifier_hash: string;
      }
    | undefined,
  max_verifications_per_person: number,
): boolean => {
  if (!nullifier) {
    // Person has not verified before, can always verify for the first time
    return true;
  } else if (max_verifications_per_person <= 0) {
    // `0` or `-1` means unlimited verifications
    return true;
  }

  // Else, can only verify if the max number of verifications has not been met
  return nullifier.uses < max_verifications_per_person;
};

export const generateHashedSecret = (identifier: string) => {
  const secret = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${identifier}.${secret}`);
  const hashed_secret = hmac.digest("hex");
  return { secret, hashed_secret };
};

export const verifyHashedSecret = (
  identifier: string,
  secret: string,
  hashed_secret: string,
) => {
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${identifier}.${secret}`);
  const generated_secret = hmac.digest("hex");

  return generated_secret === hashed_secret;
};
