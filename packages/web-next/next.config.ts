import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared monorepo package so Next.js can process its TypeScript/JSX
  transpilePackages: ["@nextdestination/shared"],

  // Proxy all /api/* requests to the Express backend on Render (or localhost in dev)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.EXPRESS_API_URL || "http://localhost:3001"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
