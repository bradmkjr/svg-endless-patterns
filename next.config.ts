import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static files only, for GitHub Pages. A project site lives under
  // /<repo>; the Pages workflow passes that path, empty on a custom domain.
  output: "export",
  // With an internal API to draw them at build time, pictures ship as static files.
  env: { NEXT_PUBLIC_PRERENDERED_IMAGES: process.env.API_INTERNAL_URL ? "1" : "" },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  // Each language has its own root layout, for a correct <html lang>, so the
  // 404 page can't borrow one.
  experimental: { globalNotFound: true },
};

export default nextConfig;
