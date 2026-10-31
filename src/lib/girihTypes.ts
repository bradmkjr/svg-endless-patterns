import type { Locale } from "./generator";

export type GirihColors = { background: string; primary: string; accent: string; line: string };

export type GirihPart = { id: string; name: string; count: number };

export type GirihRequest = {
  symmetry: GirihSymmetry;
  star: GirihStar;
  /** Width of the lines, as a percent of a girih edge or the same scale on other options. */
  lineWeight: number;
  colors: GirihColors;
  /** Draw the edges of the tiles under the lines. */
  showTiles: boolean;
  /** Width of one repeat, in inches. Its height follows from the pattern. */
  repeatWidth: number;
  /** Repeats in the wall panel. */
  across: number;
  down: number;
  locale?: Locale;
};

export type GirihResult = {
  svg: { repeat: string; panel: string; stencil: string };
  /** True only for the five-tile patch. */
  isGirih: boolean;
  name: string;
  width: string;
  height: string;
  panelWidth: string;
  panelHeight: string;
  starOrder: number;
  /** Highest order of rotation of the whole pattern. */
  rotationOrder: number;
  parts: GirihPart[];
  /** Openings to cut in one stencil sheet. */
  openings: number;
  notes: string[];
  steps: string[];
};

export type GirihStar = "star" | "sharp" | "rosette";

export type GirihSymmetry = 4 | 6 | 8 | 10 | 12;
