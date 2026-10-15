import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos are served by the Laravel backend (or any CDN you configure there).
    // Unoptimized keeps images working for any host, including localhost during development.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
