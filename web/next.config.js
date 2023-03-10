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
            "img-src": "world-id-public.s3.amazonaws.com",
            "style-src": "'unsafe-inline'",
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
