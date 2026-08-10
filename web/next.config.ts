import type { NextConfig } from "next";

// `/api/*` is proxied rather than called directly so the browser only ever
// talks to one origin — no CORS, no preflight, no mixed-origin cookies.
const API_ORIGIN =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:4000";

// Baked into the routes manifest at build time, so a missing value on Vercel
// ships a production site whose chat quietly proxies to nobody's localhost.
if (!process.env.API_PROXY_TARGET && process.env.NODE_ENV === "production") {
  console.warn(
    "[next.config] API_PROXY_TARGET unset — /api/* will point at " +
      `${API_ORIGIN}. Set it to the Render URL before deploying.`,
  );
}

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
