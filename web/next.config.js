/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "connect-src 'self' https://app.posthog.com https://cookie-cdn.cookiepro.com wss://relay.walletconnect.com; img-src 'self' https://cookie-cdn.cookiepro.com https://world-id-public.s3.amazonaws.com https://worldcoin.org; script-src 'self' 'unsafe-eval' https://cookie-cdn.cookiepro.com; style-src 'unsafe-inline';",
          },
          {
            key: "Permissions-Policy",
            value: "clipboard-write=(self)",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cookie-cdn.cookiepro.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "world-id-public.s3.amazonaws.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "worldcoin.org",
        port: "",
        pathname: "**",
      },
    ],
  },
  reactStrictMode: true,
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
