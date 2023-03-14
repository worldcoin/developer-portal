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
              "https://world-id-public.s3.amazonaws.com",
              "https://worldcoin.org",
            ],
            "style-src": "'unsafe-inline'",
            "connect-src": [
              "'self'",
              "wss://relay.walletconnect.com",
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
    domains: ["world-id-public.s3.amazonaws.com"],
  },
  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) =>
      key.startsWith("NEXT_PUBLIC_")
    )
  ),
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
