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
 * The authentication routes stay mounted under `/api/auth/*` (the v4 default is
 * `/auth/*`) so that the existing url helpers (`web/lib/urls.ts`), the client
 * `useUser()` profile fetch, and the Auth0 tenant's Allowed Callback/Logout URLs
 * keep working unchanged.
 */
export const auth0 = new Auth0Client({
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    profile: "/api/auth/profile",
    accessToken: "/api/auth/access-token",
    backChannelLogout: "/api/auth/backchannel-logout",
  },

  // The portal never calls resource servers directly with an access token, so the
  // client-facing access-token endpoint stays disabled (security best practice).
  enableAccessTokenEndpoint: false,
});
