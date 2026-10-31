import type { Block } from "./blocks";
import type { PatternRequest } from "./types";

/** A typical request, so engine tests don't depend on the site's defaults. */
export function defaultRequest(block: Block): PatternRequest {
  const colors: Record<string, string> = { sashing: "#eeeeee", border: "#222222" };
  block.fabrics.forEach((f, i) => {
    colors[f.id] = ["#f4ecdc", "#23395d", "#b5533c", "#7f9ab8"][i % 4];
  });
  return { size: 12, cols: 4, rows: 5, sashing: 0, border: 3, setting: "straight", wof: 40, seams: false, colors };
}
