import type { CountedFinish, StitchTurn } from "./crossStitchTypes";
import type { Locale } from "./generator";

export type NeedlepointColor = { symbol: string; color: string; stitches: number; yards: number; strands: number; skeins: number };

export type NeedlepointRequest = {
  grid: string[];
  /** Plain colors the stitcher chooses, not matched to any yarn brand. */
  colors: string[];
  /** The canvas, for the preview only. */
  canvas: string;
  /** Canvas threads per inch. */
  mesh: number;
  stitch: NeedlepointStitch;
  yarn: NeedlepointYarn;
  /** Unworked canvas on every side, for blocking and finishing, in inches. */
  margin: number;
  finish: CountedFinish;
  locale?: Locale;
};

export type NeedlepointResult = {
  svg: { stitched: string; chart: string };
  /** The stitched area, leaving out bare rows and columns around the design. */
  columns: number;
  rows: number;
  stitches: number;
  /** Squares inside the design with no color. Needlepoint normally covers all its canvas. */
  bareStitches: number;
  widthInches: number;
  heightInches: number;
  width: string;
  height: string;
  canvasWidth: string;
  canvasHeight: string;
  colors: NeedlepointColor[];
  totalYards: number;
  totalSkeins: number;
  /** Strands of this yarn in the needle on this mesh. */
  strands: number;
  /** Everything to gather first. */
  materials: string[];
  /** Cutting, marking and working the canvas. */
  steps: string[];
  /** Colors in the order to work them, background last, as lines and as data. */
  order: string[];
  turns: StitchTurn[];
  /** Blocking and making up. */
  finishing: string[];
  /** Sheets the PDF chart takes. */
  sheets: number;
};

export type NeedlepointStitch = "tent" | "continental" | "basketweave";

export type NeedlepointYarn = "tapestry" | "persian";
