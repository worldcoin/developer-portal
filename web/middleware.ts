import {
  getSession,
  withMiddlewareAuthRequired,
} from "@auth0/nextjs-auth0/edge";
import { NextRequest, NextResponse } from "next/server";
import { Role_Enum } from "./graphql/graphql";
import { Auth0SessionUser } from "./lib/types";
import { urls } from "./lib/urls";
import { checkUserPermissions } from "./lib/utils";

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_IMAGES_CDN_URL || "https://world-id-assets.com",
);
const s3BucketUrl = `https://${process.env.ASSETS_S3_BUCKET_NAME}.s3.${process.env.ASSETS_S3_REGION}.amazonaws.com`;
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
        ...(isDev ? ["'unsafe-eval'"] : []),
        "https://cookie-cdn.cookiepro.com",
        "https://app.posthog.com",
      ],
    },
    {
      name: "font-src",
      values: [
        "'self'",
        "http://world-id-assets.com",
        "http://staging.world-id-assets.com",
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
        ...(s3BucketUrl ? [s3BucketUrl] : []),
      ],
    },
    {
      name: "img-src",
      values: [
        "'self'",
        "blob:", // Used to enforce image width and height
        "data:",
        "https://worldcoin.org",
        ...(s3BucketUrl ? [s3BucketUrl] : []),
        ...(cdnURLObject ? [cdnURLObject.hostname] : []),
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

const checkRouteRolesRestrictions = async (request: NextRequest) => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const { pathname } = request.nextUrl;
  const urlSegments = pathname.split("/");
  const teamId = urlSegments[2];

  // Route Subset Restriction
  const ownerOnlyRoutes = [
    "/teams/[a-zA-Z0-9_]+/apps/[a-zA-Z0-9_]+/danger$",
    "/teams/[a-zA-Z0-9_]+/danger$",
    "/teams/[a-zA-Z0-9_]+/settings$",
  ];
  const ownerAndAdminRoutes = [
    "/teams/[a-zA-Z0-9_]+/apps/[a-zA-Z0-9_]+/actions/[a-zA-Z0-9_]+/danger$",
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

export default withMiddlewareAuthRequired({
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

export const config = {
  matcher: [
    "/teams/:path*",
    "/create-team",
    "/profile/:path*",
    "/join-callback",
  ],
};
