import { getPosts } from "./content";
import { getBlocks, getStitchPatterns } from "./generator";
import { optionPath, TOOL_OPTIONS, type ToolId } from "./toolOptions";

/** Every page's path, without a language: the sitemap and the share cards both list these. */
export async function sitePaths(): Promise<string[]> {
  const blocks = await getBlocks();
  const knitting = await getStitchPatterns("knit");
  const crochet = await getStitchPatterns("crochet");
  const posts = await getPosts();
  return [
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
}
