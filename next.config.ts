import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/exports/services/:slug.csv", destination: "/api/exports/services/:slug" },
      { source: "/exports/:type.csv", destination: "/api/exports/:type" },
    ];
  },
};

export default nextConfig;
