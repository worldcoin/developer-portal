import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextRequest } from "next/server";
import { getAllowedAppBaseUrls } from "@/lib/app-base-url";
import { cache } from "react";

/**
 * Central Auth0 SDK client (v4).
 *
 * Configuration is loaded from environment variables:
 * - `AUTH0_DOMAIN` (bare domain, e.g. `example.us.auth0.com`)
 * - `AUTH0_CLIENT_ID`
 * - `AUTH0_CLIENT_SECRET`
 * - `AUTH0_SECRET` (32-byte hex cookie encryption key)
 * - `APP_BASE_URL` (e.g. `https://developer.worldcoin.org`)
 *
 * All auth routes are pinned under `/api/auth/*` (v4 defaults to `/auth/*`) so
 * the Auth0 tenant's Allowed Callback/Logout URLs and the `lib/urls.ts` helpers
 * keep working unchanged. This includes the internal `profile` endpoint polled
 * by the client `useUser()` hook: `useUser()` resolves its fetch URL from the
 * build-time `NEXT_PUBLIC_PROFILE_ROUTE`, which is inlined to `/api/auth/profile`
 * in every build path (web/Dockerfile ARG default, the .env files, and the CI
 * build/e2e jobs) so the client and the mounted server route always agree.
 */
export const auth0 = new Auth0Client({
  // Served on both worldcoin.org and world.org. Pass both as the appBaseUrl
  // allow-list so the SDK builds callback/logout redirects on the host the
  // request came in on: the OAuth transaction cookie is set on that host and the
  // callback must return to the same registrable domain. A single static base URL
  // would send sibling-host logins a cross-domain callback the browser can't
  // attach the cookie to. Origins outside the list (internal/health-check hosts)
  // make the SDK throw InvalidConfigurationError; proxy.ts catches that and
  // redirects them to the canonical host instead of returning a 500.
  appBaseUrl: getAllowedAppBaseUrls(),

  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    profile: "/api/auth/profile",
  },

  // The portal never calls resource servers directly with an access token, so the
  // client-facing access-token endpoint stays disabled (security best practice).
  enableAccessTokenEndpoint: false,
});

/**
 * Build a body-free request carrying only the cookies/headers the Auth0 SDK reads,
 * for use with `auth0.getSession(req)` / `auth0.updateSession(req, ...)` inside
 * route handlers that also read the request body.
 *
 * On Next 16 the request passed to a route handler isn't recognized as a
 * `NextRequest` by the SDK, so the SDK re-wraps it and copies its body — which
 * throws `TypeError: Response body object should not be disturbed or locked` once
 * the body has been read (e.g. via `req.json()`). The SDK only needs cookies, so
 * hand it this body-free copy and read the body off the original request.
 */
// Deduplicates auth0.getSession() within a single server render pass so that
// multiple layouts on the same request share one cookie decrypt.
export const getSession = cache(() => auth0.getSession());

export const toSessionRequest = (req: NextRequest): NextRequest =>
  new NextRequest(req.url, { headers: req.headers });
