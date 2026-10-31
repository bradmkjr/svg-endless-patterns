/** The JSON contract with the API's knit colorwork routes. */

type KnitColorworkSection = { heading: string; items: { label?: string; text: string }[] };

export type KnitColorworkTechnique = "stranded" | "mosaic" | "intarsia";

export type KnitColorworkRequest = {
  /** A design id from KNIT_COLORWORK_DESIGNS. */
  design: string;
  /** The design's name in the request's language. */
  name: string;
  /** Inches, one of KNIT_COLORWORK_SIZES. */
  squareSize: number;
  /** Stitches and rows per 4" in the chart pattern. */
  stitchGauge: number;
  rowGauge: number;
  /** Main yarn, chart letter A. */
  color: string;
  /** Contrast yarns, chart letters B and on. */
  contrast?: string[];
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type KnitColorworkPlan = {
  sideStitches: number;
  borderRows: number;
  repeatWidth: number;
  repeatHeight: number;
  repeats: number;
  /** Plain stitches between the side border and the first repeat. Intarsia only. */
  margin: number;
  bodyStitches: number;
  castOn: number;
  chartRepeats: number;
  /** Plain rows below and above the charted rows. Intarsia only. */
  padRows: number;
  bodyRows: number;
  rows: number;
  width: number;
  height: number;
  borderHeight: number;
};

export type KnitColorworkYarn = { letter: string; color: string; stitches: number; floatStitches: number; yards: number; bobbins: number };
/** A chart row whose longest float, in the fitted square, is over the limit at this gauge. */
export type KnitColorworkFlag = { row: number; length: number };
export type KnitColorworkWrittenRow = { row: number; side: "right" | "wrong"; yarn?: string; text: string };

export type KnitColorworkResult = {
  title: string;
  name: string;
  technique: KnitColorworkTechnique;
  techniqueName: string;
  svg: { square: string; chart: string };
  plan: KnitColorworkPlan;
  finished: { width: string; height: string };
  colors: { letter: string; color: string }[];
  yarn: KnitColorworkYarn[];
  totalYards: number;
  floatLimit: number;
  flags: KnitColorworkFlag[];
  writtenRows: KnitColorworkWrittenRow[];
  sections: KnitColorworkSection[];
};
