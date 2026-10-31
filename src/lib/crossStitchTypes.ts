import type { Locale } from "./generator";

/** How the finished piece is made up. */
export type CountedFinish = "frame" | "pillow";

export type StitchTurn = { index: number; symbol: string; color: string; stitches: number; column: number; row: number };

export type ChartSheet = { column: number; row: number; columns: number; rows: number; overlapColumns: number; overlapRows: number };

export type MakingUp = {
  boardWidth: string;
  boardHeight: string;
  /** Ground folded around the board. */
  wrap: string;
  /** The piece, cut down for a pillow's seams. */
  trimWidth: string;
  trimHeight: string;
  strip: string;
  /** Strips for the sides, then for the top and bottom. */
  sideStrip: string;
  topStrip: string;
  backWidth: string;
  backHeight: string;
  pillowWidth: string;
  pillowHeight: string;
  /** A whole-inch form, at or just above the pillow. */
  formWidth: string;
  formHeight: string;
};

export type CrossStitchColor = { symbol: string; color: string; stitches: number; yards: number; strands: number; skeins: number };

export type CrossStitchRequest = {
  grid: string[];
  /** Plain colors the stitcher chooses, not matched to any thread brand. */
  colors: string[];
  /** The fabric, for the preview only. */
  fabric: string;
  /** Stitches per inch: the Aida count. */
  count: number;
  /** Strands of six-strand floss in the needle. */
  strands: number;
  /** Bare fabric to leave on every side, in inches. */
  margin: number;
  finish: CountedFinish;
  locale?: Locale;
};

export type CrossStitchResult = {
  svg: { stitched: string; chart: string };
  /** The stitched area, leaving out bare rows and columns around the design. */
  columns: number;
  rows: number;
  stitches: number;
  widthInches: number;
  heightInches: number;
  width: string;
  height: string;
  fabricWidth: string;
  fabricHeight: string;
  colors: CrossStitchColor[];
  totalYards: number;
  totalSkeins: number;
  /** Everything to gather first. */
  materials: string[];
  /** Cutting, marking and stitching. */
  steps: string[];
  /** Colors in the order to stitch them, as lines and as data. */
  order: string[];
  turns: StitchTurn[];
  /** Washing and making up. */
  finishing: string[];
  /** Sheets the PDF chart takes. */
  sheets: number;
};
