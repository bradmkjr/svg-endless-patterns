import type { MetadataRoute } from "next";
import { getBlocks } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blocks = await getBlocks();
  return ["/", "/blocks/", "/about/", ...blocks.map((b) => `/blocks/${b.slug}/`)].map((path) => ({ url: absoluteUrl(path) }));
}
