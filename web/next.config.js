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
            "font-src": "'self' 'https://fonts.googleapis.com'",
          },
          frameOptions: "SAMESITE",
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
