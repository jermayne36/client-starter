import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Strict React mode for development
  reactStrictMode: true,

  // Transpile monorepo packages
  transpilePackages: ["@client/shared"],

  // Prevent Next.js from bundling Prisma — it must be resolved at runtime
  // in the monorepo from packages/database/node_modules
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project slugs (can also be set via SENTRY_ORG / SENTRY_PROJECT env vars)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print Sentry output in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Delete source maps from the build output after uploading to Sentry
  // so they are never served to the browser
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Webpack-specific options (has no effect in Turbopack dev builds)
  webpack: {
    // Annotate React components for better Sentry stack traces
    reactComponentAnnotation: {
      enabled: true,
    },
    // Tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
