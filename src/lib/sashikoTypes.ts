import type { Locale } from "./generator";

export type SashikoMotif = "asanoha" | "seigaiha" | "shippo" | "kikko" | "kagome" | "squares" | "diamonds";

export type SashikoRequest = {
  motif: SashikoMotif;
  /** The motif's grid size in inches. What it measures depends on the motif: see `motifTile`. */
  spacing: number;
  /** Length of one stitch on the right side, in inches. */
  stitch: number;
  /** Finished panel, in inches. */
  width: number;
  height: number;
  cloth: string;
  thread: string;
  locale?: Locale;
};

export type SashikoResult = {
  svg: { panel: string };
  motif: string;
  width: string;
  height: string;
  spacing: string;
  stitch: string;
  gap: string;
  stitches: number;
  threadYards: number;
  sheets: number;
  /** Many lines here are shorter than one stitch and gap, so the stitches shrink to fit. */
  tight: boolean;
  steps: string[];
};
