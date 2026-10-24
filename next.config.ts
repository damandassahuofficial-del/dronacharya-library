import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Production build ke time strict type errors ko ignore karega
    ignoreBuildErrors: true,
  },
  eslint: {
    // Production build ke time ESLint warnings/errors ko ignore karega
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;