import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: "/assets/:path*",
        destination: "/api/assets/:path*",
      },
    ];
  },
};

export default nextConfig;
