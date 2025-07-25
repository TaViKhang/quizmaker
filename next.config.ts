import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      loaders: {},
      resolveAlias: {}
    }
  },
  // Optimize font loading
  optimizeFonts: true,
  // Enable keep-alive for better network performance
  httpAgentOptions: {
    keepAlive: true
  }
};

export default nextConfig;
