import type { Locale } from "./generator";

export type WeavingStructure = "plain" | "twill" | "herringbone" | "point-twill" | "broken-twill" | "satin" | "basket" | "huck" | "overshot" | "ms-and-os" | "summer-and-winter" | "rosepath";

export type WeavingStripe = { color: string; count: number };

export type WeavingRequest = {
  structure: WeavingStructure;
  /** A named traditional draft, which replaces the structure's own threading, tie-up and treadling. */
  draft?: string;
  shafts: number;
  /** The structure's scale: longer twill runs, bigger blocks. */
  size: number;
  /** Ups and downs of a twill or satin tie-up, as "2/2", or "standard". */
  tieUp: string;
  /** Color order of the warp and weft, repeated across and down. */
  warp: WeavingStripe[];
  weft: WeavingStripe[];
  locale?: Locale;
};

export type WeavingResult = {
  svg: { cloth: string; draft: string; tile: string };
  shafts: number;
  treadles: number;
  /** One repeat of the weave, and of weave and color together. */
  ends: number;
  picks: number;
  repeatEnds: number;
  repeatPicks: number;
  seamless: boolean;
  floats: { warp: number; weft: number };
  threading: number[];
  tieUp: number[][];
  treadling: number[];
  tabby: [number[], number[]] | null;
  warpOrder: string;
  weftOrder: string;
  colors: { letter: string; color: string }[];
  steps: string[];
  source: string | null;
};
