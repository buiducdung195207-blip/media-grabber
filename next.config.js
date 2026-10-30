/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow serverless functions up to 60s on Vercel Pro (free tier: 10s)
  // Each API route can override with `export const maxDuration`
  experimental: {
    serverComponentsExternalPackages: ["fluent-ffmpeg", "@distube/ytdl-core", "ytdl-core"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
