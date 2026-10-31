export const SITE_NAME = "Endless Patterns";

/** The deployed origin and path. The Pages workflow sets it, custom domain included. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bradmkjr.github.io/svg-endless-patterns").replace(/\/$/, "");

/** An absolute URL for a site path, for canonicals, sitemaps and share cards. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path}`;
}

/** A file in `public/`, for plain `<img>` tags: Next only adds the base path to its own links. */
export function publicPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
