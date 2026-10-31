import type { Locale } from "./generator";

export type CelticBreakPattern = "none" | "random" | "mirror" | "rotate" | "frame" | "cross" | "diamond" | "lattice";

export type CelticInterlace = "open" | "tight" | "off";

export type CelticKnotRequest = {
  /** Grid cells across and down. */
  cols: number;
  rows: number;
  pattern: CelticBreakPattern;
  /** Used only by random, mirror and rotate. The same seed always gives the same breaks. */
  seed: number;
  /** Percent of crossings to try replacing with a break, for the seeded patterns. */
  density: number;
  /** Ribbon width, as a percent of half a grid cell. */
  ribbon: number;
  interlace: CelticInterlace;
  colors: string[];
  /** Give each strand the next color in turn; otherwise all use the first. */
  perStrand: boolean;
  background: string;
  outline: string;
  /** Longest side of the finished design, in inches. */
  size: number;
  locale?: Locale;
};

export type CelticKnotResult = {
  svg: { art: string; cut: string; stencil: string; coloring: string };
  strands: number;
  crossings: number;
  breaks: number;
  /** Separate closed shapes in the cut file. */
  pieces: number;
  strandList: CelticStrand[];
  steps: string[];
};

export type CelticStrand = { index: number; color: string; crossings: number };
