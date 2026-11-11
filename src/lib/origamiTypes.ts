import type { Locale } from "./generator";

export type OrigamiModel = "dog" | "cup" | "fortune-teller" | "santa-hat" | "christmas-tree" | "samurai-helmet" | "crane";
export type OrigamiPrint = "plain" | "asanoha" | "seigaiha" | "shippo" | "kikko" | "dots" | "truchet" | "waves";
/** Where the printed sheet shows its fold lines: nowhere, faintly on the pattern, or on the back. */
export type OrigamiGuide = "none" | "front" | "back";
/** Front is the patterned side, back the plain one; accent draws the pattern. */
export type OrigamiColors = { front: string; back: string; accent: string };

export type OrigamiRequest = {
  model: OrigamiModel;
  print: OrigamiPrint;
  /** Side of the square sheet, in inches. */
  paperSize: number;
  guide: OrigamiGuide;
  colors: OrigamiColors;
  locale?: Locale;
};

export type OrigamiResult = {
  svg: {
    /** Each step's diagram, in order, then the finished model last. */
    steps: string[];
    /** The sheet's front at true size. */
    sheet: string;
    /** The sheet's back, mirrored to line up when printed on the reverse. */
    back: string;
  };
  model: string;
  /** One line for each diagram. */
  steps: string[];
  difficulty: 1 | 2 | 3;
  difficultyLabel: string;
  paper: string;
  creases: { mountain: number; valley: number };
};
