import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep dev and production build artifacts separate to avoid stale chunk errors.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
