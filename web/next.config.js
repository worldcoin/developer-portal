/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["world-id-public.s3.amazonaws.com"],
  },
  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) =>
      key.startsWith("NEXT_PUBLIC_")
    )
  ),
  async redirects() {
    return [
      {
        source: "/api/v1/oidc/.well-known/openid-configuration",
        destination: "/.well-known/openid-configuration",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
