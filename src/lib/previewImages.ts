import { API_VERSION } from "./mazeApi";
import { TARTAN_PRESETS } from "./tartanState";
import { API_IMAGE_GROUPS, apiThumbPath, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

/**
 * Pictures saved as static files at build time, from the internal API: an SVG of each pattern
 * for thumbnails, and a PNG for its builder page's main image. Bots can index them all, and
 * none of them needs the public API.
 */

/** Every pattern the API draws. */
export function imageList(): { group: ThumbGroup; slug: string }[] {
  return API_IMAGE_GROUPS.flatMap((group): { group: ThumbGroup; slug: string }[] => {
    if (group === "tartan") return TARTAN_PRESETS.map((preset) => ({ group, slug: preset.id }));
    return TOOL_OPTIONS[group as ToolId].options.map(({ slug }) => ({ group, slug }));
  });
}

/** Server only: `API_INTERNAL_URL` never reaches the browser. */
const internalBase = () => `${(process.env.API_INTERNAL_URL ?? "").replace(/\/+$/, "")}/api/${API_VERSION}`;

export function internalPreviewUrl(group: string, slug: string): string {
  return `${internalBase()}${apiThumbPath(group as ThumbGroup, slug.replace(/\.svg$/, ""))}`;
}

/** The size the API offers for a builder page's main image. */
export function internalPngUrl(group: string, slug: string): string {
  return `${internalBase()}/preview/${group}/${slug}?size=1200`;
}
