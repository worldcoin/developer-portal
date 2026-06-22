// @ts-check

const cdnURLObject = new URL(
  process.env.NEXT_PUBLIC_IMAGES_CDN_URL || "https://world-id-assets.com",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  serverExternalPackages: ["winston", "dd-trace"],

  output: "standalone",
  images: {
    // Next 16 changed the default from 60s to 4h. Pin the previous value so a
    // user who updates an app icon/image doesn't keep seeing the stale one (up to
    // 4h) from the image optimizer cache.
    minimumCacheTTL: 60,
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

  // Turbopack is the default bundler in Next 16; a `webpack` config would make
  // `next build` fail. winston (server-only) gets pulled into the client graph and
  // references `fs`, so alias it to an empty module for the browser — the Turbopack
  // equivalent of the old webpack `resolve.fallback: { fs: false }`.
  turbopack: {
    resolveAlias: {
      fs: { browser: "./empty.ts" },
    },
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
        source: "/teams/:teamId/apps/:appId/configuration/app-store",
        permanent: false,
        destination: "/teams/:teamId/apps/:appId/configuration",
      },
      {
        source: "/teams/:teamId/apps/:appId/configuration/advanced",
        permanent: false,
        destination: "/teams/:teamId/apps/:appId/configuration",
      },
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
