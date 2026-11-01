import { TARTAN_PRESETS } from "./tartanState";
import { API_IMAGE_GROUPS, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";
import { API_VERSION } from "./mazeApi";

/**
 * Pictures saved as static files at build time, from the internal API. Browsers and bots
 * then load them from the site itself, never reaching the public API behind Cloudflare.
 */

export const PREVIEW_SIZES = [320, 1200];

/** Every picture the API can draw for the site. */
export function imageList(): { group: ThumbGroup; slug: string }[] {
  return API_IMAGE_GROUPS.flatMap((group): { group: ThumbGroup; slug: string }[] => {
    if (group === "tartan") return TARTAN_PRESETS.map((preset) => ({ group, slug: preset.id }));
    return TOOL_OPTIONS[group as ToolId].options.map(({ slug }) => ({ group, slug }));
  });
}

/** Server only: `API_INTERNAL_URL` never reaches the browser. */
export function internalPreviewUrl(group: string, slug: string, size: string): string {
  const base = (process.env.API_INTERNAL_URL ?? "").replace(/\/+$/, "");
  return `${base}/api/${API_VERSION}/preview/${group}/${slug.replace(/\.png$/, "")}.png?size=${size}`;
}
