/** The JSON contract with the API's checkerboard routes. */

export type CheckerPattern = "checker" | "brick" | "half-drop" | "gingham" | "double-check" | "stairs" | "houndstooth" | "hexagon" | "triangle";

/** How the board is laid out: a flat grid (the default, left out of a request), a spiral, or a cone seen from above. */
export type CheckerLayout = "grid" | "spiral" | "conical";

export type CheckerboardRequest = {
  pattern: CheckerPattern;
  cols: number;
  rows: number;
  ratioWidth: number;
  ratioHeight: number;
  unit: number;
  colors: string[];
  /** Left out for a grid. On a round layout, `cols` counts the boxes around and `rows` the rings. */
  layout?: Exclude<CheckerLayout, "grid">;
  locale?: "en" | "es" | "fr" | "de" | "pt" | "it" | "nl";
};

export type CheckerboardResult = {
  svg: { art: string; repeat: string };
  pattern: string;
  /** A round layout's name. */
  layout?: string;
  /** For a round layout: whether the colors come out even all the way round. */
  seamless?: boolean;
  finished: { width: string; height: string };
  box: { width: string; height: string };
  counts: { color: string; boxes: number }[];
};
