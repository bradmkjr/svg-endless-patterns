import type { Locale } from "./generator";

/** Two mirrors make a round picture; the rest are mirror cells that tile the plane. */
export type KaleidoscopeMirrors = "two-mirror" | "square" | "60-60-60" | "45-45-90" | "30-60-90";

export type KaleidoscopeSource = "beads" | "shards" | "ribbons" | "truchet" | "sashiko" | "celtic-knot" | "tessellation" | "stained-glass" | "quilt-block" | "girih" | "cross-stitch";

export type KaleidoscopeRequest = {
  mirrors: KaleidoscopeMirrors;
  /** Two mirrors only: the picture repeats this many times around. */
  segments: number;
  /** The tiling systems only: repeats across the picture. */
  repeats: number;
  source: KaleidoscopeSource;
  /** The same seed always scatters the same source. Pattern sources don't read it. */
  seed: number;
  /** How far the source is turned in its cell, in whole degrees from 0 to 359. */
  angle: number;
  /** The source's size, as a percentage. */
  zoom: number;
  /** Where the source's middle sits from the turning point; its radius is 100. */
  offsetX: number;
  offsetY: number;
  colors: string[];
  background: string;
  locale?: Locale;
};

export type KaleidoscopeResult = {
  /**
   * `art` is the whole picture and `repeat` one seamless tile, for the systems that tile. Each
   * has one element marked `data-turn` whose `rotate()` turns the source, so a browser can spin
   * it without asking again.
   */
  svg: { art: string; repeat?: string };
  mirrors: KaleidoscopeMirrors;
  /** The mirror cell's corner angles, in degrees. */
  angles: number[];
  /** Reflected copies of the cell: in the round picture, or in one repeat. */
  copies: number;
  /** One repeat's size in inches. */
  tile: { width: number; height: number } | null;
  angle: number;
};
