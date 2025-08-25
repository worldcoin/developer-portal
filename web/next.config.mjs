// @ts-check

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_IMAGES_CDN_URL || "https://world-id-assets.com",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["winston"],
  },

  output: "standalone",
  images: {
    remotePatterns: [
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

  poweredByHeader: false,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load server-only modules on the client as:
      // fs: module loaded by winston
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },

  async headers() {
    return [
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
