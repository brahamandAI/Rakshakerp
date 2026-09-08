import type { NextConfig } from "next";
import path from "path";

/** Pin tracing to this app folder (avoids parent lockfile / monorepo confusion). */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Keep recently visited dashboard pages in the client router cache so
    // sidebar navigation can paint immediately instead of waiting on RSC.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Avoid flaky PageNotFoundError for /_document during "Collecting page data" on Windows.
    webpackBuildWorker: false,
  },
};

export default nextConfig;




