import {
  getSession,
  withMiddlewareAuthRequired,
} from "@auth0/nextjs-auth0/edge";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
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

// Next.js routes any POST to an unmatched path to the internal
// `/_not-found/page`. When that POST *looks like* a Server Action — it carries
// a `next-action` header, or a `multipart/form-data` body — the app router runs
// the Server Action machinery against the not-found page and throws while
// decoding the body. This surfaces as a server-side HTTP 500 with either
// "Failed to find Server Action." or "Failed to parse body as FormData.".
// (A bare `application/x-www-form-urlencoded` POST without `next-action` is NOT
// affected: Next bails out of the action handler and serves a clean 404, so we
// deliberately leave those alone.)
//
// In production these 500s are exclusively bot/scanner traffic: file-upload
// exploit probes (`/wp-admin/admin-ajax.php`, `/.../upload.php`, etc.) that
// POST multipart bodies to paths that do not exist. ~1.2k throw a 500 each
// week and inflate the service error rate, with zero real users behind them.
//
// We intercept those requests in middleware — before the app router invokes
// the Server Action handler — and return a clean response instead of letting
// Next throw.
//
// Safety: every genuine Server Action in this app is invoked via the Next.js
// client fetch path (react-hook-form `handleSubmit` -> `await action(...)`),
// which ALWAYS sends both the `next-action` and `next-router-state-tree`
// headers (see next/dist/.../server-action-reducer). There are no
// progressively-enhanced `<form action={...}>` (no-JS / MPA) Server Actions.
// So the presence of `next-router-state-tree` reliably marks a real action
// from a live page, and we exempt it. We only short-circuit possible-action
// POSTs that lack that header — i.e. requests that could never be a real
// action and would otherwise land on the not-found page and 500.
const NEXT_ACTION_HEADER = "next-action";
const NEXT_ROUTER_STATE_TREE_HEADER = "next-router-state-tree";

// True for POSTs that Next would feed into the Server Action handler against
// the not-found page and that throw (500) when the body can't be decoded:
// a `next-action` header, or a `multipart/form-data` body.
const isThrowingServerActionPost = (request: NextRequest): boolean => {
  if (request.method !== "POST") {
    return false;
  }
  if (request.headers.has(NEXT_ACTION_HEADER)) {
    return true;
  }
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.startsWith("multipart/form-data");
};

// Returns a short-circuit response for a stale/bot Server-Action POST that
// would otherwise throw a 500 on the not-found page, or `null` to let the
// request proceed untouched.
const handleStaleServerActionPost = (
  request: NextRequest,
): NextResponse | null => {
  if (!isThrowingServerActionPost(request)) {
    return null;
  }
  // A live page's Server Action fetch always carries the router state tree.
  // Its presence means this is (or could be) a real action — never touch it.
  if (request.headers.has(NEXT_ROUTER_STATE_TREE_HEADER)) {
    return null;
  }
  // No router state tree => not a real action from a live page. This is the
  // stale-deployment / scanner shape. Respond with a clean 409 carrying a
  // header the client (web/app/global-error.tsx) can act on, instead of
  // letting Next render the not-found page for a POST and throw a 500.
  return NextResponse.json(
    {
      error: "stale_or_unrecognized_server_action",
      description:
        "This request targets a Server Action that does not exist on the current deployment, or a route that was not found.",
    },
    {
      status: 409,
      headers: {
        "x-stale-deployment": "1",
        "cache-control": "no-store",
      },
    },
  );
};

// Mirrors the `matcher` route subset that actually requires the Auth0 session
// + CSP handling. The matcher below is intentionally broad so the stale-action
// interceptor can see bot traffic on arbitrary paths, but auth/CSP must remain
// scoped to these app pages exactly as before.
const authProtectedMatchers = [
  /^\/teams(\/|$)/,
  /^\/create-team$/,
  /^\/profile(\/|$)/,
  /^\/join-callback$/,
];

const isAuthProtectedPath = (pathname: string): boolean =>
  authProtectedMatchers.some((pattern) => pattern.test(pathname));

const checkRouteRolesRestrictions = async (request: NextRequest) => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];
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

// Auth0 session + role/CSP enforcement for the protected app pages. Unchanged
// behaviour — only invoked for `authProtectedMatchers` paths (see dispatcher).
const authMiddleware = withMiddlewareAuthRequired({
  middleware: async function middleware(request: NextRequest) {
    try {
      const redirect = await checkRouteRolesRestrictions(request);

      if (redirect) {
        return redirect;
      }

      const { csp, nonce } = generateCsp();
      const headers = new Headers(request.headers);
      headers.set("x-nonce", nonce);
      headers.set("content-security-policy", csp);
      const response = NextResponse.next({ request: { headers } });
      response.headers.set("content-security-policy", csp);
      response.headers.set("Permissions-Policy", "clipboard-write=(self)");
      response.headers.set("x-current-path", request.nextUrl.pathname);
      return response;
    } catch (error) {
      console.warn("Error in middleware", { error });
      return NextResponse.error();
    }
  },

  returnTo: (req) =>
    urls.api.loginCallback({
      returnTo: req.nextUrl.pathname,
    }),
});

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // 1. Short-circuit stale/bot Server-Action POSTs to unmatched routes before
  //    the app router can run the action handler and throw a 500.
  const staleActionResponse = handleStaleServerActionPost(request);
  if (staleActionResponse) {
    return staleActionResponse;
  }

  // 2. Enforce auth/CSP for the protected app pages, exactly as before.
  if (isAuthProtectedPath(request.nextUrl.pathname)) {
    return authMiddleware(request, event);
  }

  // 3. Everything else passes through untouched (equivalent to middleware not
  //    running for this request).
  return NextResponse.next();
}

export const config = {
  // Run on all paths so the stale-action interceptor can catch bot/scanner
  // POSTs to arbitrary unmatched routes. Static assets, image optimizer and
  // Next internals are excluded — they are never Server Action targets and we
  // must not add overhead there. Auth/CSP stay scoped via `isAuthProtectedPath`.
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
