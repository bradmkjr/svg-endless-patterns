import type { Locale } from "./generator";

export type RdPreset = "spots" | "mitosis" | "coral" | "labyrinth" | "stripes" | "worms" | "holes" | "bubbles";
export type RdDirection = "none" | "horizontal" | "vertical" | "rising" | "falling";
export type RdStyle = "filled" | "outline" | "bands";
export type RdColors = { background: string; primary: string; accent: string };

export type RdRequest = {
  preset: RdPreset;
  seed: number;
  /** Cells across the repeat. The shapes keep their size in cells, so more cells fit more shapes. */
  scale: number;
  /** Steps the simulation runs. */
  iterations: number;
  /** Where the outline sits, as a percent of the way from the field's lowest value to its highest. */
  threshold: number;
  /** Which way the chemicals spread faster, stretching the shapes. */
  direction: RdDirection;
  style: RdStyle;
  /** Outline width, used by the outline style. */
  weight: number;
  colors: RdColors;
  /** Width of one repeat, in inches. */
  repeatWidth: number;
  locale?: Locale;
};

export type RdResult = {
  svg: { repeat: string };
  preset: string;
  feed: number;
  kill: number;
  cells: number;
  steps: number;
  /** Percent of the repeat inside the outline. */
  coverage: number;
  /** Separate outlines on the torus. */
  contours: number;
  repeat: string;
};
