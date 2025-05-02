import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  crossOrigin: 'use-credentials',
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig;