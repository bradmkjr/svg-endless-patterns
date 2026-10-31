import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static files only, for GitHub Pages. A project site lives under
  // /<repo>; the Pages workflow passes that path, empty on a custom domain.
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
};

export default nextConfig;
