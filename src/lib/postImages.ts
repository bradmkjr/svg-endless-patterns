import type { Post } from "./content";
import { TARTAN_PRESETS } from "./tartanState";
import { thumbSrc, TOOL_OPTIONS, type ToolId } from "./toolOptions";

/**
 * A post's featured image is the thumbnail of its first sample's pattern. Thumbnails are
 * small files, loaded as they near the screen, so the blog page stays light however many
 * posts it lists. They show the pattern, in default colors, rather than the sample's settings.
 */

/** Which thumbnails a sample kind uses, when its name differs from the tool's. */
const TOOLS: Record<string, ToolId> = { celtic: "celticKnot" };
/** The choice a tool opens with, for a sample whose link leaves it out. */
const OPENING: Record<ToolId, string> = { truchet: "arcs", tessellation: "p4", girih: "10-fold", sashiko: "asanoha", celticKnot: "mirror", stainedGlass: "rose", crossStitch: "rosette", needlepoint: "kilim", tieDye: "spiral", maze: "square", fractal: "dragon-curve", knitColorwork: "little-pines", crochetColorwork: "diamond-lattice", mandala: "12-fold" };
const FALLBACK = thumbSrc("blocks", "log-cabin");

type Sample = Extract<Post["body"][number], { type: "samples" }>["items"][number];

function sampleImage(sample: Sample): string {
  if (sample.kind === "block") return thumbSrc("blocks", sample.slug);
  if (sample.kind === "knit" || sample.kind === "crochet") return thumbSrc(sample.kind, sample.slug);
  if (sample.kind === "tartan") return thumbSrc("tartan", TARTAN_PRESETS[0].id);
  const tool = TOOLS[sample.kind] ?? (sample.kind as ToolId);
  const { param, options } = TOOL_OPTIONS[tool];
  const value = new URLSearchParams(sample.query).get(param);
  return thumbSrc(tool, options.find((option) => option.value === value)?.slug ?? OPENING[tool]);
}

export function postImage(post: Pick<Post, "body">): string {
  for (const block of post.body) if (block.type === "samples" && block.items.length) return sampleImage(block.items[0]);
  return FALLBACK;
}
