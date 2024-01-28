// @ts-check

/** @type {import('next-safe').nextSafe} */
// @ts-ignore
const nextSafe = require("next-safe");
const isDev = process.env.NODE_ENV !== "production";
console.log(process.env.NODE_ENV);
// NOTE: WE must update this before a production deployment
// const s3BucketUrl = `${process.env.ASSETS_S3_BUCKET_NAME}.s3.${process.env.ASSETS_S3_REGION}.amazonaws.com`;
// const cdnHostName = process.env.ASSETS_CDN_URL || "world-id-assets.com";

// Temporary hard coded for staging
const s3BucketUrl = `developer-portal-assets-worldidassetsbucketc058846-lzpwkl4owe2n.s3.us-east-1.amazonaws.com`;
const cdnHostName = "staging.world-id-assets.com";

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
              ...(s3BucketUrl ? [`https://${s3BucketUrl}`] : []),
            ],
            "style-src": "'unsafe-inline'",
            "connect-src": [
              "'self'",
              "https://app.posthog.com",
              "https://cookie-cdn.cookiepro.com",
              "https://pactsafe.io",
              "https://bridge.worldcoin.org",
              ...(s3BucketUrl ? [`https://${s3BucketUrl}`] : []),
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
        pathname: `/unverified/**`,
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
