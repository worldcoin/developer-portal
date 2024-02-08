import { withMiddlewareAuthRequired } from "@auth0/nextjs-auth0/edge";
import { NextRequest, NextResponse } from "next/server";

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL ||
    "https://world-id-assets.com"
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
      values: ["'self'", "https://world-id-public.s3.amazonaws.com"],
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
        "https://bridge.worldcoin.org",
      ],
    },
    {
      name: "img-src",
      values: [
        "'self'",
        "blob:", // Used to enforce image width and height
        "https://world-id-public.s3.amazonaws.com",
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

export default withMiddlewareAuthRequired(async function middleware(
  request: NextRequest
) {
  const { csp, nonce } = generateCsp();
  const headers = new Headers(request.headers);

  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("Permissions-Policy", "clipboard-write=(self)");

  return response;
});

export const config = { matcher: ["/teams", "/teams/:path*", "/create-team"] };
