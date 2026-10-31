/**
 * The generation contract. Everything here is plain JSON, so these same shapes
 * can become the request and response bodies of a backend API.
 */

import type { Locale } from "./i18n";

export type { Locale };

export type Setting = "straight" | "alternate" | "quadrants";

export type PatternRequest = {
  /** Finished block size, in inches. */
  size: number;
  cols: number;
  rows: number;
  sashing: number;
  border: number;
  setting: Setting;
  /** Usable width of fabric after selvages, in inches. */
  wof: number;
  /** Draw seam lines on the block, quilt and tile. */
  seams: boolean;
  /** Color per block fabric id, plus "sashing" and "border". */
  colors: Record<string, string>;
  /** Language for generated text. English when left out. */
  locale?: Locale;
};

export type Craft = "knit" | "crochet";

/** A knit or crochet project: a rectangle of one stitch pattern at the maker's gauge. */
export type StitchRequest = {
  /** Wanted finished size, in inches. */
  width: number;
  length: number;
  /** Stitches and rows per 4 inches. */
  stitchGauge: number;
  rowGauge: number;
  color: string;
  /** Knit only: the complete square's size in inches, one of KNIT_SQUARE_SIZES. */
  squareSize?: number;
  /** Language for generated text. English when left out. */
  locale?: Locale;
};

export type StitchInfo = {
  slug: string;
  name: string;
  craft: Craft;
  level: string;
  summary: string;
  /** Rows per 4" relative to plain fabric in the same yarn: a starting point before swatching. */
  rowFactor: number;
};

export type StitchResult = {
  svg: { chart: string; swatch: string };
  /** The number to start with: stitches to cast on, or chains to make. */
  startCount: number;
  startLabel: string;
  stitchesPerRow: number;
  rows: number;
  /** Finished size after rounding to whole pattern repeats. */
  width: string;
  length: string;
  /** A rough guide, from stitch count and gauge. */
  yards: number;
  /** Row-by-row instructions, for the rows that repeat. */
  setup: string[];
  pattern: { label: string; text: string }[];
  repeatNote: string;
  finish: string[];
  abbreviations: string[];
  /** Knit only: the complete square pattern. */
  square?: KnitSquare;
  /** Crochet only: the complete written pattern, with materials, edging and finishing. */
  crochet?: CrochetPlan;
};

export type KnitSquareSection = { heading: string; items: { label?: string; text: string }[] };

/** A complete knitted square, in the order it's worked. */
export type KnitSquare = {
  title: string;
  size: number;
  castOn: number;
  rows: number;
  sideStitches: number;
  borderRows: number;
  bodyRows: number;
  /** Finished size after rounding to whole repeats. */
  width: string;
  length: string;
  yards: number;
  weightId: string;
  needle: string;
  sections: KnitSquareSection[];
};

export type CrochetPlanLine = { label?: string; text: string };

export type CrochetPlanRow = {
  /** The rows this covers, inclusive. */
  from: number;
  to: number;
  /** Chains or row-below stitches and spaces used. */
  consumes: number;
  /** Stitches and spaces made, and those split into worked stitches and chain spaces. */
  makes: number;
  worked: number;
  spaces: number;
};

export type CrochetPlan = {
  materialsHeading: string;
  materials: { label: string; text: string }[];
  sections: { heading: string; lines: CrochetPlanLine[] }[];
  /** The numbers behind the text, so tests can follow the pattern. */
  data: {
    chains: number;
    extraChains: number;
    stitches: number;
    rowCount: number;
    turningChains: number;
    rows: CrochetPlanRow[];
    /** Sc between corners on each side, and sc worked into each of the four corners. */
    edging: { top: number; bottom: number; left: number; right: number; cornerStitches: number; total: number };
    bodyWidth: number;
    bodyLength: number;
    finishedWidth: number;
    finishedLength: number;
    yards: number;
  };
};

export type FabricInfo = { id: string; label: string };

/** A catalog entry: everything about a block except its geometry. */
export type BlockInfo = {
  slug: string;
  name: string;
  family: string;
  level: string;
  grid: number;
  fabrics: FabricInfo[];
  summary: string;
};

export type CutLine = {
  fabric: string;
  description: string;
  rounded: boolean;
};

export type PatternResult = {
  svg: { block: string; quilt: string; tile: string };
  /** Cuts for one block, then for the whole quilt top including sashing and border. */
  blockCuts: CutLine[];
  quiltCuts: CutLine[];
  quilt: {
    width: number;
    height: number;
    blocks: number;
    /** Display strings for sizes: "54" or "~54 1/8". */
    widthLabel: string;
    heightLabel: string;
  };
  yardage: { fabric: string; label: string; yards: string }[];
  backing: { yards: string; panels: number; width: string; height: string };
  binding: { yards: string; strips: number; stripWidth: string };
  steps: string[];
  /** Some cuts were rounded up because the block falls between ruler marks. */
  hasRoundedCuts: boolean;
  /** The nearest block sizes that land on ruler marks, if this one doesn't. */
  suggestedSizes: number[];
};
