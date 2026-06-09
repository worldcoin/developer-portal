import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { Role_Enum } from "./graphql/graphql";
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
const computeAltAppUrl = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return undefined;
  }
  const { hostname } = parsed;
  if (hostname.endsWith(".worldcoin.org")) {
    parsed.hostname = `${hostname.slice(0, -".worldcoin.org".length)}.world.org`;
  } else if (hostname.endsWith(".world.org")) {
    parsed.hostname = `${hostname.slice(0, -".world.org".length)}.worldcoin.org`;
  } else {
    return undefined;
  }
  return parsed.origin;
};
const altAppUrl = computeAltAppUrl(appUrl);
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
        // Font files are served from https://world-id-assets.com (see
        // `web/styles/globals.css`), so the source must match the https
        // scheme — http-only source expressions don't match https requests.
        "https://world-id-assets.com",
        "https://staging.world-id-assets.com",
      ],
    },
    {
      name: "style-src",
      values: [
        "'self'",
        "'unsafe-inline'",
        "fonts.googleapis.com",
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
    "/teams/[a-zA-Z0-9_]+/settings$",
  ];
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

export async function middleware(request: NextRequest) {
  // 1. Let the Auth0 SDK mount its routes (`/api/auth/login`, `/callback`,
  //    `/logout`, `/profile`, ...) and refresh the rolling session cookie. For a
  //    mounted auth route this returns the auth response directly.
  const authRes = await auth0.middleware(request);

  const { pathname } = request.nextUrl;

  // Auth SDK routes pass straight through: the tenant-facing routes under
  // `/api/auth/*` (login/logout/callback, plus our custom login-callback /
  // delete-account handlers) and the default-path `/auth/profile` used by the
  // client `useUser()` hook.
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/auth/")) {
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
  //    so the root layout (`web/scenes/Root/layout`) can read `x-nonce` during
  //    SSR, and set on the response so the browser enforces the policy.
  const { csp, nonce } = generateCsp();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  response.headers.set("Permissions-Policy", "clipboard-write=(self)");
  response.headers.set("x-current-path", pathname);

  // Preserve any session-refresh cookies set by `auth0.middleware()`.
  for (const cookie of authRes.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/auth/:path*",
    "/teams/:path*",
    "/create-team",
    "/profile/:path*",
    "/join-callback",
  ],
};
