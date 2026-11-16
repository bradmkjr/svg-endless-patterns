/** The JSON contract with the API's lettering routes. */
import type { ColorworkWeight } from "./crochetColorworkTypes";

export type LetteringFont = "rounded" | "thin" | "slab" | "serif" | "script" | "decorative" | "pixel";
export type LetteringTechnique = "tapestry" | "c2c" | "quilt";
export type LetteringLayout = "panel" | "square" | "squares";
export type LetteringAlign = "center" | "left" | "right";

export type LetteringRequest = {
  /** The words, with a line break between lines. */
  message: string;
  font: LetteringFont;
  /** A capital's height on the first line, in stitches, blocks or squares. */
  height: number;
  /** The same on every later line. Missing, it's `height`. */
  height2?: number;
  layout: LetteringLayout;
  align?: LetteringAlign;
  /** Ground between letters. Missing, it grows with the letters. */
  spacing?: number;
  /** Ground between lines. Missing, it's a third of the first line's height. */
  lineGap?: number;
  margin: number;
  border: number;
  /** Ground, letters, border. */
  colors: [string, string, string];
  technique: LetteringTechnique;
  /** Crochet only. */
  weight?: ColorworkWeight;
  /** A quilt's finished square, in inches. Quilt only. */
  square?: number;
  locale?: "en" | "es" | "fr" | "de" | "pt" | "it" | "nl";
};

/** What the API couldn't make, for the visitor to fix. */
export type LetteringProblem =
  | { kind: "empty" }
  | { kind: "tooLong" }
  | { kind: "unsupported"; chars: string[] }
  | { kind: "tooBig"; width: number; height: number; most: number };

export type LetteringLine = { label?: string; text: string };
export type LetteringSection = { heading: string; lines: LetteringLine[] };
export type LetteringPiece = { label: string; count: number; width: number; height: number; grid: string[] };
export type LetteringColor = { letter: string; role: "ground" | "letters" | "border"; color: string; units: number; amount: string; bobbins?: number };

export type LetteringResult = {
  svg: { picture: string; chart: string };
  technique: LetteringTechnique;
  width: number;
  height: number;
  across: number;
  down: number;
  capHeights: number[];
  pieces: LetteringPiece[];
  colors: LetteringColor[];
  totalYards: number;
  finished: { width: number; height: number };
  summary: LetteringSection;
  materials: LetteringSection;
  sections: LetteringSection[];
  chartHelp: string;
};
