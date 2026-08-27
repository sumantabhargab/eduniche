import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Force output tracing to the nested project root
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
