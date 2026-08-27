import { getAllowedAppBaseUrls } from "@/lib/app-base-url";
import { NextRequest } from "next/server";
import "server-only";
import { getAppUrlFromRequest } from "./utils";

const toOrigin = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const reviewerRequestOrigin = (req: NextRequest): string | null => {
  const dashboardHost = process.env.INTERNAL_DASHBOARD_HOST?.trim();
  try {
    if (dashboardHost) {
      if (dashboardHost.includes(",") || dashboardHost.includes("://")) {
        return null;
      }
      return new URL(`https://${dashboardHost}`).origin.toLowerCase();
    }

    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      return null;
    }

    return req.nextUrl.origin.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Strict Origin comparison for privileged JSON APIs. Staging/production use
 * the configured HTTPS dashboard host, ignoring caller-controlled forwarding
 * headers. Local development falls back to the parsed request URL.
 */
export const isOriginSameAsEffectiveHost = (req: NextRequest): boolean => {
  const origin = req.headers.get("origin");
  const effectiveOrigin = reviewerRequestOrigin(req);

  if (!origin || !effectiveOrigin) return false;

  try {
    return new URL(origin).origin.toLowerCase() === effectiveOrigin;
  } catch {
    return false;
  }
};

/**
 * Cross-site request guard for cookie-authenticated, state-changing endpoints.
 *
 * The Auth0 session cookie is `SameSite=Lax` (SDK default — `lib/auth0.ts` sets no
 * `session.cookie` override), so the browser attaches it to any cross-site
 * *top-level navigation*. "A valid session cookie is present" is therefore not
 * evidence that the request came from our own UI, and a destructive handler gated
 * on the session alone is CSRF-able by a plain `<a href>` on an attacker's page.
 *
 * Endpoints using this guard must also be mounted on a non-idempotent method:
 * `Lax` never sends the cookie on a cross-site POST, so the method restriction is
 * the primary defence and this check is the layer that survives a future change to
 * the cookie's `SameSite` attribute.
 *
 * `Sec-Fetch-Site` is set by the browser and cannot be forged from page JS. Only
 * `same-origin` is accepted — `same-site` would let a takeover of any sibling
 * subdomain reach the endpoint, and our own callers always use a relative URL.
 *
 * Fail-closed: a request carrying neither `Sec-Fetch-Site` nor `Origin` cannot be
 * shown to be same-origin. Every browser that can render the portal sends at least
 * one of them on a `fetch()`, so rejecting costs no real client.
 */
export const isSameOriginRequest = async (
  req: NextRequest,
): Promise<boolean> => {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) return secFetchSite === "same-origin";

  const origin = toOrigin(req.headers.get("origin") ?? undefined);
  if (!origin) return false;

  const configured = getAllowedAppBaseUrls();
  const allowed = [
    await getAppUrlFromRequest(req),
    ...(Array.isArray(configured) ? configured : [configured]),
  ].flatMap((value) => toOrigin(value) ?? []);

  return allowed.includes(origin);
};
