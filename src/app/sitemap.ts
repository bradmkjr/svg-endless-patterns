import type { MetadataRoute } from "next";
import { getBlocks, getStitchPatterns } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blocks = await getBlocks();
  const knitting = await getStitchPatterns("knit");
  const crochet = await getStitchPatterns("crochet");
  return [
    "/",
    "/blocks/",
    "/knitting/",
    "/crochet/",
    "/about/",
    ...blocks.map((b) => `/blocks/${b.slug}/`),
    ...knitting.map((s) => `/knitting/${s.slug}/`),
    ...crochet.map((s) => `/crochet/${s.slug}/`),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
