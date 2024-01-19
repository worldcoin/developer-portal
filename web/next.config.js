// @ts-check

/** @type {import('next-safe').nextSafe} */
// @ts-ignore
const nextSafe = require("next-safe");
const isDev = process.env.NODE_ENV !== "production";
const s3BucketUrl = process.env.AWS_S3_BUCKET_URL;
const cdnUrl = process.env.ASSETS_CDN_URL;
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: nextSafe({
          isDev,
          contentSecurityPolicy: {
            mergeDefaultDirectives: true,
            "img-src": [
              "'self'",
              "blob:", // Used to enforce image width and height
              "https://world-id-public.s3.amazonaws.com",
              "https://worldcoin.org",
              ...(s3BucketUrl ? [s3BucketUrl] : []),
            ],
            "style-src": "'unsafe-inline'",
            "connect-src": [
              "'self'",
              "https://app.posthog.com",
              "https://cookie-cdn.cookiepro.com",
              "https://pactsafe.io",
              "https://bridge.worldcoin.org",
              ...(s3BucketUrl ? [s3BucketUrl] : []),
            ],
            "script-src": [
              "'self'",
              "https://cookie-cdn.cookiepro.com",
              "https://app.posthog.com",
            ],
          },
          permissionsPolicy: {
            "clipboard-write": `self`,
          },
        }),
      },
    ];
  },

  reactStrictMode: true,
  images: {
    // TODO: world-id-public.s3.amazonaws.com is deprecated and should be removed
    domains: ["world-id-public.s3.amazonaws.com", ...(cdnUrl ? [cdnUrl] : [])],
  },
  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith("NEXT_PUBLIC_")
    )
  ),

  async redirects() {
    return [
      {
        source: "/privacy-statement",
        permanent: false,
        destination:
          "https://worldcoin.pactsafe.io/rjd5nsvyq.html#contract-9l-r7n2jt",
      },
      {
        source: "/tos",
        permanent: false,
        destination:
          "https://worldcoin.pactsafe.io/rjd5nsvyq.html#contract-b1q9midy9",
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/.well-known/openid-configuration",
        destination: "/api/v1/oidc/openid-configuration",
      },
    ];
  },
};

module.exports = nextConfig;
