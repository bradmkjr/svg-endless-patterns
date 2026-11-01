import type { Post } from "./content";
import { TARTAN_PRESETS } from "./tartanState";
import { OPENING_OPTION, thumbSrc, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

/**
 * A post's featured image is the thumbnail of its first sample's pattern. Thumbnails are
 * small files, loaded as they near the screen, so the blog page stays light however many
 * posts it lists. They show the pattern, in default colors, rather than the sample's settings.
 */

/** Which thumbnails a sample kind uses, when its name differs from the tool's. */
const TOOLS: Record<string, ToolId> = { celtic: "celticKnot" };
const FALLBACK: PostPicture = { group: "blocks", slug: "log-cabin" };

export type PostPicture = { group: ThumbGroup; slug: string };

type Sample = Extract<Post["body"][number], { type: "samples" }>["items"][number];

function picture(sample: Sample): PostPicture {
  if (sample.kind === "block") return { group: "blocks", slug: sample.slug };
  if (sample.kind === "knit" || sample.kind === "crochet") return { group: sample.kind, slug: sample.slug };
  if (sample.kind === "tartan") return { group: "tartan", slug: TARTAN_PRESETS[0].id };
  const tool = TOOLS[sample.kind] ?? (sample.kind as ToolId);
  const { param, options } = TOOL_OPTIONS[tool];
  const value = new URLSearchParams(sample.query).get(param);
  return { group: tool, slug: options.find((option) => option.value === value)?.slug ?? OPENING_OPTION[tool] };
}

/** The pattern a post is pictured with. */
export function samplePicture(post: Pick<Post, "body">): PostPicture {
  for (const block of post.body) if (block.type === "samples" && block.items.length) return picture(block.items[0]);
  return FALLBACK;
}

export function postImage(post: Pick<Post, "body">): string {
  const { group, slug } = samplePicture(post);
  return thumbSrc(group, slug);
}
