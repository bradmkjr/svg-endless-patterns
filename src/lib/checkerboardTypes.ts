/** The JSON contract with the API's checkerboard routes. */

export type CheckerPattern = "checker" | "brick" | "half-drop" | "gingham" | "hexagon" | "triangle";

export type CheckerboardRequest = {
  pattern: CheckerPattern;
  cols: number;
  rows: number;
  ratioWidth: number;
  ratioHeight: number;
  unit: number;
  colors: string[];
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type CheckerboardResult = {
  svg: { art: string; repeat: string };
  pattern: string;
  finished: { width: string; height: string };
  box: { width: string; height: string };
  counts: { color: string; boxes: number }[];
};
