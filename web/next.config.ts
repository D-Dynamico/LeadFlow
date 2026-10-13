import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // next dev otherwise regenerates web/AGENTS.md on every start.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
