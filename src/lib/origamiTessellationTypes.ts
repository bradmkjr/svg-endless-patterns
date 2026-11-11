import type { Locale } from "./generator";

export type TessellationPattern = "miura-ori" | "yoshimura" | "waterbomb" | "square-twist";
export type CreaseColors = { paper: string; mountain: string; valley: string };

export type OrigamiTessellationRequest = {
  pattern: TessellationPattern;
  /** Units across and down. */
  cols: number;
  rows: number;
  /** Degrees. What it measures depends on the pattern: see `ANGLE_RANGES`. */
  angle: number;
  /** Sheet width in inches; its height follows the pattern. */
  width: number;
  colors: CreaseColors;
  locale?: Locale;
};

export type OrigamiTessellationResult = {
  svg: { pattern: string };
  pattern: string;
  /** Sheet size, in inches. */
  width: string;
  height: string;
  mountains: number;
  valleys: number;
  steps: string[];
};
