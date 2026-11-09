import type { Locale, QuiltFinish, Setting } from "./patternTypes";

/** The API's `/quilt` contract: a whole quilt from a choice of blocks. */

export type QuiltArrangement = "repeat" | "alternate" | "sampler";
export type QuiltQuilting = "none" | "outline" | "ditch" | "stipple" | "meander" | "crosshatch";
export type QuiltBatting = "none" | "cotton" | "polyester";

export type QuiltRequest = {
  arrangement: QuiltArrangement;
  /** Block slugs, or "plain" for a plain square: the first to repeat, the first two to alternate, all of them for a sampler. */
  blocks: string[];
  size: number;
  cols: number;
  rows: number;
  sashing: number;
  border: number;
  setting: Setting;
  wof: number;
  /** A block's first fabric takes the first color, its second the second, and so on around. */
  palette: string[];
  sashingColor: string;
  borderColor: string;
  /** Percent of fabric choices swapped for scraps of the same color, many of them prints. A multiple of 10. */
  noise: number;
  /** Every piece takes any of the palette's colors. */
  scrappy: boolean;
  seed: number;
  quilting: QuiltQuilting;
  /** Draw the quilting lines. They're counted and weighed either way. */
  showQuilting: boolean;
  thread: string;
  finish?: QuiltFinish;
  batting: QuiltBatting;
  locale?: Locale;
};

export type QuiltCutMapLine = { method: "square" | "rect" | "strip" | "half" | "quarter" | "template"; w: number; h: number; qty: number; pieces: number; text: string; rounded: boolean; svg: string };
export type QuiltWeightPart = "top" | "backing" | "batting" | "binding" | "thread";

export type QuiltResult = {
  svg: { quilt: string; detail: string };
  quilt: { width: number; height: number; blocks: number; widthLabel: string; heightLabel: string };
  blocks: { slug: string; count: number }[];
  /** `id` is `palette-<n>`, `sashing` or `border`. */
  yardage: { id: string; color: string; yards: string }[];
  yardageEstimated: boolean;
  /** Cuts by color (`palette-<n>`, `sashing`, `border`), or by block fabric (`scraps-<label>`, color null) when scrappy. */
  cutMap: { id: string; color: string | null; cuts: QuiltCutMapLine[] }[];
  backing: { yards: string; panels: number; width: string; height: string };
  binding: { yards: string; strips: number; stripWidth: string };
  batting: { width: string; height: string };
  /** Grams, all told and by layer. */
  weight: { grams: number; parts: { id: QuiltWeightPart; grams: number }[] };
  /** Inches of quilting, and meters of thread for it, top and bobbin. */
  stitching: { inches: number; threadMeters: number };
};
