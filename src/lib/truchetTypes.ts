import type { Locale } from "./generator";

export type TruchetArrangement = "random" | "mirror" | "checker" | "stripes" | "waves";

export type TruchetColors = { background: string; line: string; accent: string };

export type TruchetRequest = {
  style: TruchetStyle;
  arrangement: TruchetArrangement;
  /** Tiles along each side of the repeat. Even, so mirrored and alternating layouts wrap cleanly. */
  grid: number;
  /** Line width as a percent of a tile's side. Triangles are filled and don't use it. */
  weight: number;
  /** Used only by random and mirror. The same seed always gives the same tiles. */
  seed: number;
  colors: TruchetColors;
  /** Width of one repeat, in inches. */
  repeatWidth: number;
  locale?: Locale;
};

export type TruchetResult = {
  svg: { repeat: string };
  style: string;
  arrangement: string;
  tiles: number;
  repeat: string;
  /** Whether this arrangement reads the seed. */
  seeded: boolean;
};

export type TruchetStyle = "arcs" | "chamfers" | "diagonals" | "triangles";
