import type { MazePaperId } from "./mazeTypes";

/** The JSON contract with the API's puzzle routes. */

export type PuzzleType = "sudoku" | "futoshiki" | "nonogram" | "battleships" | "dots-and-boxes" | "ultimate-tic-tac-toe" | "hex";
export type PuzzleDifficulty = "easy" | "medium" | "hard";
export type PuzzlePaper = "letter" | "a4" | "tablet";
export type PuzzleColors = { background: string; ink: string; accent: string };

export type PuzzleRequest = {
  puzzle: PuzzleType;
  size: number;
  difficulty: PuzzleDifficulty;
  seed: number;
  colors: PuzzleColors;
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type PuzzleResult = {
  svg: { puzzle: string; solution?: string };
  title: string;
  rules: string;
  givens?: number;
  posterBox?: Record<MazePaperId, number>;
};
