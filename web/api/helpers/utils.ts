import "server-only";

/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
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
 * @returns Object containing authentication status and response if authentication failed
 */
export const protectInternalEndpoint = (
  req: NextRequest,
): { isAuthenticated: boolean; errorResponse: NextResponse | null } => {
  const requestHeaders = new Headers(req.headers);
  if (
    !process.env.INTERNAL_ENDPOINTS_SECRET ||
    requestHeaders.get("authorization")?.replace("Bearer ", "") !==
      process.env.INTERNAL_ENDPOINTS_SECRET
  ) {
    const response = errorForbidden(req);
    return { isAuthenticated: false, errorResponse: response };
  }
  return { isAuthenticated: true, errorResponse: null };
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

export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf("."));
};

/**
 * Adds CORS headers to a response
 * @param response - The response to add CORS headers to
 * @param methods - The methods to allow
 * @returns The response with CORS headers added
 */
export function corsHandler(response: NextResponse, methods: string[]) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

/**
 * Extracts the app URL from the request headers, supporting multiple domains
 * Falls back to NEXT_PUBLIC_APP_URL if unable to determine from request
 * @param req - The NextRequest object
 * @returns The app URL (protocol + host)
 */
export function getAppUrlFromRequest(req: NextRequest): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host;

  const protocol =
    req.headers.get("x-forwarded-proto") ||
    req.headers.get("x-forwarded-protocol") ||
    (req.nextUrl.protocol === "https:" ? "https" : "http");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
