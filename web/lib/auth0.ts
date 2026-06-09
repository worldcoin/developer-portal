import { Auth0Client } from "@auth0/nextjs-auth0/server";

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
 * The tenant-facing routes (login, logout, callback) stay mounted under
 * `/api/auth/*` (the v4 default is `/auth/*`) so the existing url helpers
 * (`web/lib/urls.ts`) and the Auth0 tenant's Allowed Callback/Logout URLs keep
 * working unchanged.
 *
 * The internal `profile` route is intentionally left at the v4 default
 * (`/auth/profile`). The client `useUser()` hook fetches it via the build-time
 * `NEXT_PUBLIC_PROFILE_ROUTE` (default `/auth/profile`); keeping the default
 * avoids having to thread a new build-time env var through the Docker image.
 * The middleware matcher includes `/auth/*` so this route is still mounted.
 */
export const auth0 = new Auth0Client({
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
  },

  // The portal never calls resource servers directly with an access token, so the
  // client-facing access-token endpoint stays disabled (security best practice).
  enableAccessTokenEndpoint: false,
});
