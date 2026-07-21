import { hasAdminAuthenticationEvidence } from "@/lib/admin-auth";
import {
  getAllowedAppBaseUrls,
  getPrimaryAppBaseUrl,
  siblingOrigin,
} from "@/lib/app-base-url";
import { auth0 } from "@/lib/auth0";
import { InvalidConfigurationError } from "@auth0/nextjs-auth0/errors";
import { NextRequest, NextResponse } from "next/server";
import { Role_Enum } from "./graphql/graphql";
import { isPortalV3EnabledForEmail } from "./lib/feature-flags/portal-v3/flag";
import { Auth0SessionUser } from "./lib/types";
import { urls } from "./lib/urls";
import { checkUserPermissions } from "./lib/utils";

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_IMAGES_CDN_URL || "https://world-id-assets.com",
);
const s3BucketUrl = `https://${process.env.ASSETS_S3_BUCKET_NAME}.s3.${process.env.ASSETS_S3_REGION}.amazonaws.com`;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
// The portal is served from both worldcoin.org and world.org variants of the
// same hostname. NEXT_PUBLIC_APP_URL is build-baked, so we mirror it onto the
// sibling domain so CSP allows assets/connections from either origin.
const altAppUrl = siblingOrigin(appUrl);
const isDev = process.env.NODE_ENV === "development";
const generateCsp = () => {
  const nonce = crypto.randomUUID();

  const csp = [
    { name: "default-src", values: ["'self'"] },
    {
      name: "script-src",
      values: [
        "'self'",
        `'nonce-${nonce}'`,
        "'wasm-unsafe-eval'", // Required for IDKit v4 WASM bridge compilation https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution
        ...(isDev ? ["'unsafe-eval'"] : []),
        "https://cookie-cdn.cookiepro.com",
        "https://app.posthog.com",
        // PostHog lazy-loads extension scripts (web-vitals, etc.) from the
        // assets host matching its US api_host (us.i.posthog.com).
        "https://us-assets.i.posthog.com",
      ],
    },
    {
      name: "font-src",
      values: [
        "'self'",
        // IDKit's bundled UI still injects TWK Lausanne font faces from this
        // asset host. App-level fonts are self-hosted by next/font.
        "https://world-id-assets.com",
        "https://staging.world-id-assets.com",
      ],
    },
    {
      name: "style-src",
      values: [
        "'self'",
        "'unsafe-inline'",
        ...(isDev ? ["'unsafe-inline'"] : []),
      ],
    },
    {
      name: "connect-src",
      values: [
        "'self'",
        ...(isDev ? ["webpack://*"] : []),
        "https://app.posthog.com",
        "https://cookie-cdn.cookiepro.com",
        "https://pactsafe.io",
        "https://worldcoin.pactsafe.io",
        "https://bridge.worldcoin.org",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
        ...(s3BucketUrl ? [s3BucketUrl] : []),
        ...(appUrl ? [appUrl] : []),
        ...(altAppUrl ? [altAppUrl] : []),
      ],
    },
    {
      name: "img-src",
      values: [
        "'self'",
        "blob:", // Used to enforce image width and height
        "data:",
        "https://world.org",
        ...(s3BucketUrl ? [s3BucketUrl] : []),
        ...(cdnURLObject ? [cdnURLObject.hostname] : []),
        ...(appUrl ? [appUrl] : []),
        ...(altAppUrl ? [altAppUrl] : []),
      ],
    },
  ];

  const cspString = csp
    .map((directive) => {
      return `${directive.name} ${directive.values.join(" ")}`;
    })
    .join("; ");

  return { csp: cspString, nonce };
};

const checkRouteRolesRestrictions = (
  request: NextRequest,
  user: Auth0SessionUser["user"],
) => {
  const { pathname } = request.nextUrl;
  const urlSegments = pathname.split("/");
  const teamId = urlSegments[2];

  // Route Subset Restriction
  const ownerOnlyRoutes = [
    "/teams/[a-zA-Z0-9_]+/apps/[a-zA-Z0-9_]+/configuration/danger$",
    "/teams/[a-zA-Z0-9_]+/danger$",
  ];
  const teamSettingsRoutes = ["/teams/[a-zA-Z0-9_]+/settings$"];
  const ownerAndAdminRoutes = [
    "/teams/[a-zA-Z0-9_]+/apps/[a-zA-Z0-9_]+/actions/[a-zA-Z0-9_]+/danger$",
    "/teams/[a-zA-Z0-9_]+/apps/[a-zA-Z0-9_]+/world-id-actions/[a-zA-Z0-9_]+/danger$",
    "/teams/[a-zA-Z0-9_]+/api-keys$",
  ];

  if (ownerOnlyRoutes.some((route) => pathname.match(route))) {
    if (!checkUserPermissions(user, teamId, [Role_Enum.Owner])) {
      return NextResponse.rewrite(new URL("/unauthorized", request.url));
    }
  }

  if (teamSettingsRoutes.some((route) => pathname.match(route))) {
    // The V3 portal allows team members to access the team settings page, but the V2 portal does not. Therefore, we check if the user has access to the V3 portal and allow them to access the team settings page if they do.
    const validRoles = isPortalV3EnabledForEmail(user?.email)
      ? [Role_Enum.Owner, Role_Enum.Admin, Role_Enum.Member]
      : [Role_Enum.Owner];

    if (!checkUserPermissions(user, teamId, validRoles)) {
      return NextResponse.rewrite(new URL("/unauthorized", request.url));
    }
  }

  if (ownerAndAdminRoutes.some((route) => pathname.match(route))) {
    if (
      !checkUserPermissions(user, teamId, [Role_Enum.Owner, Role_Enum.Admin])
    ) {
      return NextResponse.rewrite(new URL("/unauthorized", request.url));
    }
  }
  return false;
};

const protectedMatchers = [
  /^\/teams(\/|$)/,
  /^\/create-team$/,
  /^\/profile(\/|$)/,
  /^\/join-callback$/,
];
const isProtectedPath = (pathname: string) =>
  protectedMatchers.some((matcher) => matcher.test(pathname));

const isAdminPagePath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

const isAdminApiPath = (pathname: string) =>
  pathname === "/api/admin" || pathname.startsWith("/api/admin/");

// Mirrors the auth0 host normalization below (first comma-separated
// x-forwarded-host value, default port stripped) plus a lowercase pass,
// since Host/X-Forwarded-Host comparisons must be case-insensitive.
const normalizeHost = (host: string) =>
  host
    .trim()
    .replace(/:(80|443)$/, "")
    .toLowerCase();

const getForwardedHost = (request: NextRequest): string | undefined => {
  const raw =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const first = raw?.split(",")[0];

  return first ? normalizeHost(first) : undefined;
};

// Cloudflare Access protects INTERNAL_DASHBOARD_HOST as a separate hostname
// from the public portal. Unset (the default) means no host is treated as
// the dashboard entry point, so "/" keeps serving the public portal.
const isInternalDashboardHost = (request: NextRequest): boolean => {
  const dashboardHost = process.env.INTERNAL_DASHBOARD_HOST;

  if (!dashboardHost) {
    return false;
  }

  return getForwardedHost(request) === normalizeHost(dashboardHost);
};

const withSecurityHeaders = (
  response: NextResponse,
  csp: string,
  pathname: string,
) => {
  response.headers.set("content-security-policy", csp);
  response.headers.set("Permissions-Policy", "clipboard-write=(self)");
  response.headers.set("x-current-path", pathname);

  return response;
};

const createSecurityHeadersResponse = (
  request: NextRequest,
  pathname: string,
) => {
  const { csp, nonce } = generateCsp();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  return withSecurityHeaders(response, csp, pathname);
};

// The browser keeps seeing the protected dashboard hostname during
// navigation (developer-dashboard.toolsforhumanity.com/admin, not a
// redirect to the origin host), so this rewrites rather than redirects.
const createDashboardRewriteResponse = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/admin";

  const { csp, nonce } = generateCsp();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });

  return withSecurityHeaders(response, csp, "/admin");
};

const createAdminUnauthorizedResponse = (request: NextRequest) => {
  if (isAdminApiPath(request.nextUrl.pathname)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/unauthorized", request.url));
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // "/" has no product meaning of its own on the dashboard hostname, so
  // treat it as the dashboard entry point there. Every other host keeps
  // today's behavior of not running middleware on "/" at all (it wasn't in
  // `config.matcher` before this route was added).
  const isDashboardRoot = pathname === "/" && isInternalDashboardHost(request);

  const isAdminRequest =
    isDashboardRoot || isAdminPagePath(pathname) || isAdminApiPath(pathname);

  if (isAdminRequest) {
    if (
      process.env.INTERNAL_DASHBOARD_HOST &&
      !isInternalDashboardHost(request)
    ) {
      return createAdminUnauthorizedResponse(request);
    }

    if (!(await hasAdminAuthenticationEvidence(request.headers))) {
      return createAdminUnauthorizedResponse(request);
    }

    if (isDashboardRoot) {
      return createDashboardRewriteResponse(request);
    }

    if (isAdminPagePath(pathname)) {
      return createSecurityHeadersResponse(request, pathname);
    }

    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  // In allow-list mode the Auth0 SDK matches the request origin against the
  // `appBaseUrl` list with an exact, un-normalized compare. This deployment's proxy
  // can forward `x-forwarded-proto: http` and a `:80`/`:443`-suffixed host on
  // otherwise-HTTPS public traffic (the reason `getAppUrlFromRequest` exists), so a
  // legitimate worldcoin.org/world.org login would otherwise infer `http://…` /
  // `…:80`, miss the list, and throw. Normalize the forwarded proto/host on GET auth
  // requests so the SDK sees the canonical `https://<host>` form and keeps the
  // callback on the host the request came in on.
  let authReq = request;
  let normalizedOrigin: string | undefined;
  if (
    request.method === "GET" &&
    pathname.startsWith("/api/auth/") &&
    Array.isArray(getAllowedAppBaseUrls())
  ) {
    // Mirror the SDK's getFirstHeaderValue (first comma-separated value, trimmed),
    // then strip the default port it leaves on — so a proxy that appends to
    // X-Forwarded-Host (e.g. "developer.world.org:80, proxy.internal") still
    // resolves to the bare canonical host the allow-list contains.
    const host = (
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      request.nextUrl.host
    )
      ?.split(",")[0]
      ?.trim()
      ?.replace(/:(80|443)$/, "");
    if (host) {
      normalizedOrigin = `https://${host}`;
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-host", host);
      headers.set("x-forwarded-proto", "https");
      authReq = new NextRequest(request.url, { headers });
    }
  }

  // 1. Let the Auth0 SDK mount its routes (`/api/auth/login`, `/callback`,
  //    `/logout`, `/profile`, ...) and refresh the rolling session cookie. For a
  //    mounted auth route this returns the auth response directly.
  let authRes: NextResponse;
  try {
    authRes = await auth0.middleware(authReq);
  } catch (error) {
    // An auth route reached from an origin still outside the allow-list after
    // normalization is an internal/health-check host (e.g.
    // `developer.*-internal.worldcoin.org`) probing `/api/auth/login`. Redirect it
    // to the canonical host — whose origin IS allow-listed — rather than surfacing
    // the SDK's 500. Public origins are accepted by the SDK and never reach here;
    // the `!== canonical` guard keeps a (would-be) canonical-origin throw from
    // self-redirecting. We deliberately do NOT log here: this path is dominated by
    // benign, high-volume internal probes, and `console.*` from Edge middleware is
    // indexed as `status:error`, so logging each hit floods the error dashboards.
    const canonical = getPrimaryAppBaseUrl();
    if (
      error instanceof InvalidConfigurationError &&
      pathname.startsWith("/api/auth/") &&
      canonical &&
      normalizedOrigin !== new URL(canonical).origin
    ) {
      return NextResponse.redirect(
        new URL(pathname + request.nextUrl.search, canonical),
      );
    }
    throw error;
  }

  // Auth SDK routes pass straight through: login/logout/callback/profile under
  // `/api/auth/*`, plus our custom login-callback / delete-account handlers.
  if (pathname.startsWith("/api/auth/")) {
    return authRes;
  }

  if (!isProtectedPath(pathname)) {
    return authRes;
  }

  // 2. Protected routes require an authenticated session.
  let session;
  try {
    session = await auth0.getSession(request);
  } catch (error) {
    console.warn("Error in middleware", { error });
    return NextResponse.error();
  }

  if (!session) {
    const loginUrl = new URL("/api/auth/login", request.url);
    loginUrl.searchParams.set(
      "returnTo",
      urls.api.loginCallback({ returnTo: pathname }),
    );
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based route restrictions.
  const user = session.user as Auth0SessionUser["user"];
  const roleRedirect = checkRouteRolesRestrictions(request, user);
  if (roleRedirect) {
    return roleRedirect;
  }

  // 4. Attach the per-request CSP nonce. It is forwarded on the request headers
  //    so the Apollo-scoped layouts (`app/(portal)/layout.tsx` and
  //    `app/(onboarding)/create-team/layout.tsx`) can read `x-nonce` during
  //    SSR, and set on the response so the browser enforces the policy.
  const response = createSecurityHeadersResponse(request, pathname);

  // Preserve any session-refresh cookies set by `auth0.middleware()`.
  for (const cookie of authRes.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/api/auth/:path*",
    "/teams/:path*",
    "/create-team",
    "/profile/:path*",
    "/join-callback",
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};
