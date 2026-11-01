import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { getBlocks, getStitchPatterns } from "@/lib/generator";
import { localePath, SITE_LOCALES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { optionPath, TOOL_OPTIONS, type ToolId } from "@/lib/toolOptions";

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
    "/palettes/",
    "/tartans/",
    "/truchet/",
    "/tie-dye/",
    "/fractals/",
    "/life-patterns/",
    "/checkerboards/",
    "/crochet/colorwork/",
    "/knitting/colorwork/",
    "/mazes/",
    "/girih/",
    "/mandalas/",
    "/stained-glass/",
    "/celtic-knots/",
    "/sashiko/",
    "/tessellations/",
    "/cross-stitch/",
    "/needlepoint/",
    "/about/",
    "/acknowledgements/",
    "/blog/",
    "/changelog/",
    ...posts.map((p) => `/blog/${p.slug}/`),
    ...blocks.map((b) => `/blocks/${b.slug}/`),
    ...knitting.map((s) => `/knitting/${s.slug}/`),
    ...crochet.map((s) => `/crochet/${s.slug}/`),
    ...(Object.keys(TOOL_OPTIONS) as ToolId[]).flatMap((tool) => TOOL_OPTIONS[tool].options.map((o) => optionPath(tool, o.slug))),
  ];
  return SITE_LOCALES.flatMap(({ code }) => paths.map((path) => ({ url: absoluteUrl(localePath(code, path)) })));
}
