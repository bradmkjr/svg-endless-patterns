/** The JSON contract with the API's crochet colorwork routes. */

export type ColorworkTechnique = "tapestry" | "c2c" | "granny";
export type ColorworkWeight = "sport" | "dk" | "worsted" | "bulky";

export type CrochetColorworkRequest = {
  design: string;
  /** The design's name in this language. */
  name: string;
  /** The main color, letter A. It's also the edging. */
  color: string;
  contrast?: string[];
  weight: ColorworkWeight;
  /** Tiles a chart this many times each way, or repeats a granny's color sequence. */
  repeats: number;
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type ColorRun = { letter: string; count: number };
export type TapestryRow = { row: number; side: "rs" | "ws"; direction: "rtl" | "ltr"; runs: ColorRun[]; stitches: number };
export type C2cDiagonal = { n: number; phase: "first" | "increase" | "decrease"; blocks: number; colors: string[]; runs: ColorRun[] };
export type GrannyRound = { n: number; letter: string; joined: "start" | "new" | "same"; dc: number; sideDc: number; sideClusters: number; ch1PerSide: number; ch1Spaces: number; corners: number };
export type EdgingPlan = { top: number; side: number; cornerStitches: number; total: number; joined: "new" | "same" };
export type ColorworkColor = { letter: string; color: string; units: number; yards: number; bobbins?: number };
export type ColorworkLine = { label?: string; text: string };
export type ColorworkSection = { heading: string; lines: ColorworkLine[] };

export type CrochetColorworkResult = {
  svg: { square: string; chart: string };
  technique: ColorworkTechnique;
  /** Stitches or blocks across and up, or rounds in `width` for a granny. */
  width: number;
  height: number;
  colors: ColorworkColor[];
  totalYards: number;
  finished: { width: number; height: number; bodyWidth: number; bodyHeight: number };
  materials: ColorworkSection;
  sections: ColorworkSection[];
  chartHelp: string;
  grid: string[];
  rows: TapestryRow[];
  diagonals: C2cDiagonal[];
  rounds: GrannyRound[];
  edging: EdgingPlan;
  foundationChains: number;
};
