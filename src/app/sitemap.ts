import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/content";
import { SEASONS } from "@/lib/seasons";
import { getBlocks, getStitchPatterns } from "@/lib/patternCatalog";
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
    "/quilts/",
    "/knitting/",
    "/crochet/",
    "/patterns/",
    "/palettes/",
    "/tartans/",
    "/truchet/",
    "/kolam/",
    "/turing-patterns/",
    "/waves/",
    "/nature-patterns/",
    "/weaving/",
    "/tie-dye/",
    "/fractals/",
    "/life-patterns/",
    "/checkerboards/",
    "/crochet/colorwork/",
    "/knitting/colorwork/",
    "/mazes/",
    "/paper-puzzles/",
    "/girih/",
    "/chinese-lattice/",
    "/mandalas/",
    "/kaleidoscopes/",
    "/stained-glass/",
    "/celtic-knots/",
    "/sashiko/",
    "/origami/",
    "/origami-tessellations/",
    "/tessellations/",
    "/cross-stitch/",
    "/needlepoint/",
    "/about/",
    "/acknowledgements/",
    "/privacy/",
    "/terms/",
    "/blog/",
    "/changelog/",
    "/seasonal/",
    ...SEASONS.map((s) => `/seasonal/${s.id}/`),
    ...posts.map((p) => `/blog/${p.slug}/`),
    ...blocks.map((b) => `/blocks/${b.slug}/`),
    ...knitting.map((s) => `/knitting/${s.slug}/`),
    ...crochet.map((s) => `/crochet/${s.slug}/`),
    ...(Object.keys(TOOL_OPTIONS) as ToolId[]).flatMap((tool) => TOOL_OPTIONS[tool].options.map((o) => optionPath(tool, o.slug))),
  ];
  return SITE_LOCALES.flatMap(({ code }) => paths.map((path) => ({ url: absoluteUrl(localePath(code, path)) })));
}
