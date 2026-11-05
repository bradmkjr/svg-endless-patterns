import type { Locale } from "./generator";

export type NatureMotif = "leaves" | "flowers" | "clouds" | "rocks" | "ferns" | "grass";
/** Scatter places motifs by dart throwing (Poisson disc); grid jitters one motif in each cell of a square grid. */
export type NatureLayout = "scatter" | "grid";
/** How close scattered motifs may come: a gap between them, just touching, or overlapping. */
export type NaturePacking = "spaced" | "touching" | "overlapping";
export type NatureStyle = "filled" | "outline";

export type NatureColors = { background: string; primary: string; secondary: string; accent: string };

export type NatureRequest = {
  motif: NatureMotif;
  layout: NatureLayout;
  /** Used only by scatter. */
  packing: NaturePacking;
  style: NatureStyle;
  /** 1 to 5: how much of the repeat the motifs aim to cover. */
  density: number;
  /** Motif size, in percent of the standard size. */
  scale: number;
  /** How far each motif's size may stray either way, in percent. */
  variation: number;
  /** How far each motif may turn either way from upright, in degrees. 180 turns them freely. */
  rotation: number;
  seed: number;
  colors: NatureColors;
  /** Width of one repeat, in inches. */
  repeatWidth: number;
  locale?: Locale;
};

export type NatureResult = {
  svg: { repeat: string };
  motif: string;
  /** Motifs in one repeat, not counting copies across the edges. */
  count: number;
  repeat: string;
};
