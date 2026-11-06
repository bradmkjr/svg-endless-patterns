import type { Locale } from "./generator";

export type KolamForm = "sikku" | "pulli" | "kambi";
export type KolamGrid = "square" | "diamond" | "hexagonal";
export type KolamRule = "symmetric" | "random";
export type KolamLine = "single" | "double";

export type KolamColors = { background: string; line: string; accent: string };

export type KolamRequest = {
  form: KolamForm;
  grid: KolamGrid;
  /** Dots along each row of the repeat. */
  size: number;
  /** Symmetric draws one finished kolam in each repeat; random lets the line run across the edges. */
  rule: KolamRule;
  line: KolamLine;
  /** Whether the dots are drawn. */
  dots: boolean;
  /** Line width as a percent of the space between neighboring dots. */
  weight: number;
  /** Both rules read it. The same seed always gives the same kolam. */
  seed: number;
  colors: KolamColors;
  /** Width of one repeat, in inches. A hexagonal repeat is a little taller than wide. */
  repeatWidth: number;
  locale?: Locale;
};

export type KolamResult = {
  svg: { repeat: string };
  form: string;
  grid: string;
  rule: string;
  /** Dots in one repeat. */
  dots: number;
  /** Separate closed lines in one repeat, or null for a pulli kolam. */
  loops: number | null;
  /** Repeat width and height, in inches. */
  repeat: string;
  height: string;
};
