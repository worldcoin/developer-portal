import { isSameOriginRequest } from "@/api/helpers/csrf";
import { errorResponse } from "@/api/helpers/errors";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { ManagementClient } from "auth0";
import { NextRequest, NextResponse } from "next/server";

/**
 * Irreversibly deletes the caller's Auth0 identity.
 *
 * Mounted on POST only, and rejects any request the browser reports as cross-site.
 * The session cookie is `SameSite=Lax`, so a GET mount here would let any attacker
 * page destroy a logged-in developer's identity with a single top-level navigation
 * (`<a href>`, `window.open`, meta-refresh) — a valid session cookie alone does not
 * prove the request came from our own UI. See `api/helpers/csrf.ts`.
 *
 * The caller deletes the Hasura user row first, POSTs here, then navigates to
 * `/api/auth/logout` to clear the (still-valid, stateless) session cookie.
 */
export const deleteAccount = async (req: NextRequest) => {
  if (!(await isSameOriginRequest(req))) {
    return errorResponse({
      statusCode: 403,
      code: "cross_origin_request",
      detail: "Account deletion must be initiated from the developer portal",
      req,
    });
  }

  if (
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET ||
    !process.env.AUTH0_DOMAIN
  ) {
    logger.error("Missing Auth0 environment variables.");

    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Something went wrong",
      req,
    });
  }

  const session = await auth0.getSession();
  const id = session?.user.sub;

  if (!id) {
    // An unauthenticated request (no active session) is an expected client
    // condition, not a server fault. `errorResponse` already logs the 401 at
    // "warn"; emitting an extra `logger.error` here double-logs it and tags the
    // active dd-trace span as an error, surfacing routine 401s in Error Tracking.
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "Session user id not found",
      req,
    });
  }

  const managementClient = new ManagementClient({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  });

  try {
    await managementClient.users.delete({ id });
  } catch (error) {
    logger.error("Error deleting account.", { error });

    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Failed to delete account",
      req,
    });
  }

  // No redirect: the caller is a `fetch()`, and returning a 307 here would make it
  // replay the POST against `/api/auth/logout`. The client navigates to logout
  // itself, passing the host it is on so the sibling-domain return lands correctly.
  return new NextResponse(null, { status: 204 });
};
