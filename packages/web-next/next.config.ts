import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Transpile the shared monorepo package so Next.js can process its TypeScript/JSX
  transpilePackages: ["@nextdestination/shared"],

  images: {
    remotePatterns: [
      // Google Places API photos
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      // Unsplash fallback hotel images
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase storage (user avatars)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

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

export default withSentryConfig(nextConfig, {
  // Suppress noisy Sentry build output
  silent: true,
  // Disable telemetry sent to Sentry
  telemetry: false,
  // Source map upload — add SENTRY_AUTH_TOKEN + org/project to enable
  // org: "nextdestination",
  // project: "nextdestination-web",
});
