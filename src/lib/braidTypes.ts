import type { Locale } from "./generator";

export type BraidPattern = "candy-stripe" | "chevron" | "inverse-chevron" | "zigzag" | "diamond" | "heart" | "three-strand" | "four-strand" | "five-strand" | "six-strand" | "fishtail" | "endless-falls";
export type BraidFamily = "knotted" | "flat" | "falls";
export type BraidKnot = "f" | "b" | "fb" | "bf";

export type BraidRequest = {
  pattern: BraidPattern;
  strands: number;
  /** Colors in order; the pattern decides how they're laid out across the strands. */
  colors: string[];
  /** How many repeats the picture shows. */
  repeats: number;
  locale?: Locale;
};

export type BraidResult = {
  svg: { braid: string; chart: string; tile: string };
  family: BraidFamily;
  strands: number;
  /** Rows (knotted) or moves (flat) in one repeat, and until the colors line up again. */
  rows: number;
  repeatRows: number;
  order: string;
  colors: { letter: string; color: string }[];
  knots: BraidKnot[][] | null;
  steps: string[];
  source: string;
};
