import type { Locale } from "./generator";

export type MandalaMotif = "petals" | "arcs" | "dots" | "scallops" | "diamonds" | "triangles" | "lotus" | "leaves" | "teardrops" | "stars" | "hearts" | "chevrons" | "rays" | "fans" | "ogees";

export type MandalaRequest = {
  /** How many times the design repeats in one turn. */
  symmetry: number;
  rings: number;
  /** Rings from the center out. When set, these are drawn and `rings`, `motifs` and `seed` are ignored. */
  ringPlan?: MandalaRingSpec[];
  /** The motifs the seed may choose from. */
  motifs: MandalaMotif[];
  /** The same seed always gives the same design. */
  seed: number;
  /** Line width, in canvas units (the canvas is 1000 across). */
  lineWeight: number;
  colors: string[];
  background: string;
  outline: string;
  locale?: Locale;
};

export type MandalaResult = {
  svg: { art: string; coloring: string };
  symmetry: number;
  rings: MandalaRing[];
  shapes: number;
};

export type MandalaRing = { index: number; motif: MandalaMotif; copies: number; color: string; spec: MandalaRingSpec };

export type MandalaRingSpec = {
  motif: MandalaMotif;
  /** Copies per fold. The innermost ring always has one, which fixes the design's symmetry. */
  repeat: number;
  /** Depth relative to the other rings, as a percentage. */
  size: number;
  color: number;
  band: number | null;
  accent: boolean;
  /** Turn the ring half a copy, so its motifs sit between those of its neighbors. */
  offset: boolean;
};
