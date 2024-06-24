import "server-only";

/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import crypto from "crypto";
import { NextRequest } from "next/server";
import { errorForbidden } from "./errors";

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
export const protectInternalEndpoint = (req: NextRequest): boolean => {
  const requestHeaders = new Headers(req.headers);
  if (
    !process.env.INTERNAL_ENDPOINTS_SECRET ||
    requestHeaders.get("authorization")?.replace("Bearer ", "") !==
      process.env.INTERNAL_ENDPOINTS_SECRET
  ) {
    errorForbidden(req);
    return false;
  }
  return true;
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

export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf("."));
};
