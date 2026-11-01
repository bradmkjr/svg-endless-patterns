import type { MetadataRoute } from "next";
import { localePath, SITE_LOCALES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { sitePaths } from "@/lib/sitePaths";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = await sitePaths();
  return SITE_LOCALES.flatMap(({ code }) => paths.map((path) => ({ url: absoluteUrl(localePath(code, path)) })));
}
