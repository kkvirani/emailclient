import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep server-only packages out of the client bundle.
    serverActions: { bodySizeLimit: "5mb" },
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
