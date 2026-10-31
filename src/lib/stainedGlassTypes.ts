import type { Locale } from "./generator";

export type Point = [number, number];

export type StainedGlassColor = {
  letter: string;
  color: string;
  pieces: number;
  /** Square inches: the pieces themselves, then with the waste allowance. */
  cutArea: number;
  needed: number;
  squareFeet: number;
  /** Bounding box of the largest piece, so a too-small sheet is caught. */
  largest: string;
};

export type StainedGlassLayout = "rose" | "quarries" | "medallion" | "sunburst";

export type StainedGlassPiece = {
  number: number;
  /** Index into the request's colors. */
  color: number;
  letter: string;
  /** All in inches from the panel's top left corner. Line = came center line; cut = glass; sight = what shows. */
  line: Point[];
  cut: Point[];
  sight: Point[];
  /** Cut glass area in square inches. */
  area: number;
};

export type StainedGlassRequest = {
  layout: StainedGlassLayout;
  /** Outer panel size, in inches, measured over the perimeter came. */
  width: number;
  height: number;
  /** 1 to 3. Falls back to less when the design can't be cut at this size. */
  detail: number;
  /** The came's visible face, and the heart (web) between the glass edges, in inches. */
  cameWidth: number;
  heartWidth: number;
  /** Four glass colors, as #rrggbb. */
  colors: string[];
  locale?: Locale;
};

export type StainedGlassResult = {
  svg: { panel: string; numbered: string };
  layout: StainedGlassLayout;
  /** The size and detail actually drawn, which may be less than asked for: see `notes`. */
  width: number;
  height: number;
  detail: number;
  pieces: StainedGlassPiece[];
  colors: StainedGlassColor[];
  wastePercent: number;
  came: { innerFeet: number; perimeterFeet: number };
  notes: string[];
  rules: string[];
  steps: string[];
};
