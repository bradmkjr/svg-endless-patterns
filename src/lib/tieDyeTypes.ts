import type { Locale } from "./generator";

export type TieDyeGuide = { shapes: TieDyeGuideShape[]; labels: TieDyeGuideLabel[] };

export type TieDyeGuideLabel = { x: number; y: number; text: string };

export type TieDyeGuideShape = { d: string; fill?: string; stroke?: string; strokeWidth?: number };

export type TieDyeLayer = { fill: string; d: string };

export type TieDyeMix = { letter: string; color: string; ounces: number; teaspoons: number; ureaTablespoons: number };

export type TieDyeRequest = {
  technique: TieDyeTechnique;
  /** Wedges of a spiral, rings of a bullseye, or twice the folds of an accordion. */
  bands: number;
  /** One to four dyes. */
  dyes: string[];
  fabric: string;
  /** The same seed always gives the same design. */
  seed: number;
  /** Adult T-shirts, for the mixing amounts. */
  garments: number;
  /** Teaspoons of dye powder per cup of water, from the dye's label. */
  strength: number;
  locale?: Locale;
};

export type TieDyeResult = {
  svg: { art: string; guide: string };
  technique: TieDyeTechnique;
  layers: number;
  mix: TieDyeMix[];
  /** Cups of soda ash and gallons of water, for a soak. */
  steps: { fold: string[]; apply: string[]; soak: string[]; cure: string[]; safety: string[] };
};

export type TieDyeTechnique = "spiral" | "bullseye" | "accordion" | "sunburst" | "chevron" | "double-spiral";
