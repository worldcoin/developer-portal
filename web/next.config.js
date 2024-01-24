// @ts-check

/** @type {import('next-safe').nextSafe} */
// @ts-ignore
const nextSafe = require("next-safe");
const isDev = process.env.NODE_ENV !== "production";
const s3BucketUrl = `https://s3.${process.env.ASSETS_S3_REGION}.amazonaws.com/${process.env.ASSETS_S3_BUCKET_NAME}`;
const cdnHostName = process.env.ASSETS_CDN_URL || "world-id-assets.com";
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "world-id-public.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: cdnHostName,
      },
      {
        protocol: "https",
        hostname: s3BucketUrl,
      },
    ],
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
