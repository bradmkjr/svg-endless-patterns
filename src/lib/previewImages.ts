import catalog from "./patternCatalog.json";
import { API_VERSION } from "./mazeApi";
import { TARTAN_PRESETS } from "./tartanState";
import { API_IMAGE_GROUPS, apiThumbPath, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

/**
 * SVG pictures saved as static files at build time, from the internal API, for every thumbnail.
 * This is the only thing the build asks the API for: PNGs load in the browser.
 */

/** Every pattern the API draws. */
export function imageList(): { group: ThumbGroup; slug: string }[] {
  return API_IMAGE_GROUPS.flatMap((group): { group: ThumbGroup; slug: string }[] => {
    if (group === "blocks") return [...catalog.blocks.en.map(({ slug }) => ({ group, slug })), { group, slug: "log-cabin-layout" }];
    if (group === "knit" || group === "crochet") return catalog.stitches.en.filter((s) => s.craft === group).map(({ slug }) => ({ group, slug }));
    if (group === "tartan") return TARTAN_PRESETS.map((preset) => ({ group, slug: preset.id }));
    return TOOL_OPTIONS[group as ToolId].options.map(({ slug }) => ({ group, slug }));
  });
}

/** Server only: `API_INTERNAL_URL` never reaches the browser. */
const internalBase = () => `${(process.env.API_INTERNAL_URL ?? "").replace(/\/+$/, "")}/api/${API_VERSION}`;

export function internalPreviewUrl(group: string, slug: string): string {
  return `${internalBase()}${apiThumbPath(group as ThumbGroup, slug.replace(/\.svg$/, ""))}`;
}
