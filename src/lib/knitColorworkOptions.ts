import type { KnitColorworkTechnique } from "./generator";

/**
 * What the site needs to know about each design without its chart: pages, starting gauge and
 * how many contrast yarns to offer. `knitColorwork.test.ts` checks this against the engine's charts.
 */
export const KNIT_COLORWORK_OPTIONS: { id: string; technique: KnitColorworkTechnique; contrasts: number }[] = [
  { id: "little-pines", technique: "stranded", contrasts: 1 },
  { id: "small-diamonds", technique: "stranded", contrasts: 1 },
  { id: "two-way-diamonds", technique: "stranded", contrasts: 1 },
  { id: "ribbon-chevron", technique: "stranded", contrasts: 2 },
  { id: "little-bands", technique: "stranded", contrasts: 2 },
  { id: "block-check", technique: "stranded", contrasts: 2 },
  { id: "mosaic-chevron", technique: "mosaic", contrasts: 1 },
  { id: "mosaic-diamonds", technique: "mosaic", contrasts: 1 },
  { id: "mosaic-bricks", technique: "mosaic", contrasts: 1 },
  { id: "mosaic-crosses", technique: "mosaic", contrasts: 1 },
  { id: "heart-block", technique: "intarsia", contrasts: 1 },
  { id: "diamond-block", technique: "intarsia", contrasts: 2 },
  { id: "window-block", technique: "intarsia", contrasts: 2 },
];
