import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { getAllowedAppBaseUrls } from "@/lib/app-base-url";

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
  // The portal is served on both the worldcoin.org and world.org host variants.
  // Pass both in allow-list mode so v4 builds callback/logout redirects from the
  // host the request came in on (v3 derived redirect_uri from the request host
  // via getAppUrlFromRequest), instead of always using a single APP_BASE_URL.
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
