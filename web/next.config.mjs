const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "worldcoin.org",
      new URL(process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL || "https://world-id-assets.com").hostname,
    ],
  },
};

export default nextConfig;
