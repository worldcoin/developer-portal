/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
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
