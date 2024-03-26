// @ts-check

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL ||
    "https://world-id-assets.com",
);

const publicAppURL =
  process.env.NEXT_PUBLIC_APP_URL || "https://developer.worldcoin.org";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: publicAppURL,
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

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
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
