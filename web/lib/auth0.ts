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
 * The tenant-facing routes (login, logout, callback) stay mounted under
 * `/api/auth/*` (the v4 default is `/auth/*`) so the existing url helpers
 * (`web/lib/urls.ts`) and the Auth0 tenant's Allowed Callback/Logout URLs keep
 * working unchanged.
 *
 * The internal `profile` route is kept on the v4 default (`/auth/profile`),
 * NOT under `/api/auth/*`. The client `useUser()` hook fetches it via the
 * build-time `NEXT_PUBLIC_PROFILE_ROUTE` (default `/auth/profile`); matching the
 * default avoids threading a new build-time env var through the Docker image
 * (the deploy only sets env at runtime, which is never inlined into the client
 * bundle). It is set explicitly below for clarity and mounted via the `/auth/*`
 * middleware matcher.
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
    // v4 default; matches the client useUser() profile fetch (see above).
    profile: "/auth/profile",
  },

  // The portal never calls resource servers directly with an access token, so the
  // client-facing access-token endpoint stays disabled (security best practice).
  enableAccessTokenEndpoint: false,
});
