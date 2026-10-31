import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { getBlocks, getStitchPatterns } from "@/lib/generator";
import { localePath, SITE_LOCALES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blocks = await getBlocks();
  const knitting = await getStitchPatterns("knit");
  const crochet = await getStitchPatterns("crochet");
  const posts = await getPosts();
  const paths = [
    "/",
    "/blocks/",
    "/knitting/",
    "/crochet/",
    "/patterns/",
    "/tartans/",
    "/about/",
    "/blog/",
    "/changelog/",
    ...posts.map((p) => `/blog/${p.slug}/`),
    ...blocks.map((b) => `/blocks/${b.slug}/`),
    ...knitting.map((s) => `/knitting/${s.slug}/`),
    ...crochet.map((s) => `/crochet/${s.slug}/`),
  ];
  return SITE_LOCALES.flatMap(({ code }) => paths.map((path) => ({ url: absoluteUrl(localePath(code, path)) })));
}
