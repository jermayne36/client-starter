import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict React mode for development
  reactStrictMode: true,

  // Transpile monorepo packages
  transpilePackages: ["@client/shared"],
};

export default nextConfig;
