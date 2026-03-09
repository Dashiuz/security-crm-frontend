import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // This can help with some absolute path issues in dev
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
