import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static files only, for GitHub Pages. A project site lives under
  // /<repo>; the Pages workflow passes that path, empty on a custom domain.
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  // Each language has its own root layout, for a correct <html lang>, so the
  // 404 page can't borrow one.
  experimental: { globalNotFound: true },
};

export default nextConfig;
