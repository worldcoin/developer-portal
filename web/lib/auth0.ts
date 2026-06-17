import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Central Auth0 SDK client (v4).
 *
 * Configuration is loaded from environment variables:
 * - `AUTH0_DOMAIN` (bare domain, e.g. `example.us.auth0.com`)
 * - `AUTH0_CLIENT_ID`
 * - `AUTH0_CLIENT_SECRET`
 * - `AUTH0_SECRET` (32-byte hex cookie encryption key)
 * - `APP_BASE_URL` (the canonical app origin, e.g. `https://developer.worldcoin.org`)
 *
 * `appBaseUrl` is intentionally left unset so the SDK uses the single static
 * `APP_BASE_URL` env var. Do NOT pass an allow-list array here: v4's
 * `resolveAppBaseUrl` THROWS `InvalidConfigurationError` for any request origin
 * not in the array — including internal/health-check hosts (e.g.
 * `developer.staging-internal.worldcoin.org`) that hit `/api/auth/login` — which
 * 500s those requests. The static base URL never throws and builds the
 * callback/logout URLs against the canonical host.
 *
 * All auth routes are pinned under `/api/auth/*` (v4 defaults to `/auth/*`) so
 * the Auth0 tenant's Allowed Callback/Logout URLs and the `lib/urls.ts` helpers
 * keep working unchanged. The internal `profile` endpoint is also under
 * `/api/auth/*`: `useUser()` resolves its fetch URL from the build-time
 * `NEXT_PUBLIC_PROFILE_ROUTE` (inlined to `/api/auth/profile` via the Dockerfile
 * ARG default + .env + CI), so the client and the mounted server route agree.
 */
export const auth0 = new Auth0Client({
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
