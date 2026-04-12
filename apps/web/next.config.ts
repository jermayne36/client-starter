import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict React mode for development
  reactStrictMode: true,

  // Transpile monorepo packages
  transpilePackages: ["@client/shared"],

  // Prevent Next.js from bundling Prisma — it must be resolved at runtime
  // in the monorepo from packages/database/node_modules
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
