// @ts-check

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL ||
    "https://world-id-assets.com",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: cdnURLObject.hostname,
      },
      {
        protocol: "https",
        hostname: `${process.env.ASSETS_S3_BUCKET_NAME}.s3.${process.env.ASSETS_S3_REGION}.amazonaws.com`,
        pathname: `/unverified/**`,
      },
    ],
  },

  publicRuntimeConfig: Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith("NEXT_PUBLIC_"),
    ),
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

export default nextConfig;