// @ts-check

/** @type {import('next-safe').nextSafe} */
// @ts-ignore
const nextSafe = require("next-safe");
const isDev = process.env.NODE_ENV !== "production";

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
              "blob:",
              "https://world-id-public.s3.amazonaws.com",
              "https://worldcoin.org",
              "https://s3.us-east-2.amazonaws.com/dev-portal2.0-test-andy", // We need to update this with the appropriate bucket name
            ],
            "style-src": "'unsafe-inline'",
            "connect-src": [
              "'self'",
              "https://app.posthog.com",
              "https://cookie-cdn.cookiepro.com",
              "https://pactsafe.io",
              "https://bridge.worldcoin.org",
              "https://s3.us-east-2.amazonaws.com/dev-portal2.0-test-andy", // We need to update this with the appropriate bucket name
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "world-id-public.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-east-2.amazonaws.com",
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
