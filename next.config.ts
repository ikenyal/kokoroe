import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Container deploy (Lightsail, docs/deploy.md): a self-contained server in .next/standalone.
  output: "standalone",
  // Runtime reads only data/demo/*.json from disk; keep sessions, docs, evals and secrets out of the server bundle.
  outputFileTracingExcludes: {
    "/*": [".data/**", ".env*", "docs/**", "eval/**", "tests/**", "spikes/**", "scripts/**", "demo/**", "data/hidden/**", "*.md", "Dockerfile"],
  },
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
