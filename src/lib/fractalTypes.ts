/** The JSON contract with the API's fractal routes. */

export type FractalType = "koch-snowflake" | "sierpinski-triangle" | "sierpinski-carpet" | "dragon-curve" | "hilbert-curve" | "levy-curve" | "gosper-curve" | "fractal-tree" | "pythagoras-tree";
export type FractalColors = { background: string; primary: string; accent: string };

export type FractalRequest = {
  type: FractalType;
  depth: number;
  weight: number;
  angle: number;
  colors: FractalColors;
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type FractalResult = {
  svg: { art: string; outline: string };
  type: string;
  pieces: number;
};
