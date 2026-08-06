import type { NextConfig } from "next";

const API_ORIGIN =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:4000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "kai-confirmed-occasional-mailto.trycloudflare.com",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
      
    ];
  },
  async redirects() {
    // The landing page is gone — `/` is the game. Old share links kept alive.
    return [{ source: "/play", destination: "/", permanent: false }];
  },
};

export default nextConfig;
