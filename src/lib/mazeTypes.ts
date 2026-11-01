export type MazeShape = "square" | "rectangle" | "circle" | "hexagon" | "triangle" | "diamond";
export type MazeAlgorithm = "backtracker" | "prim" | "kruskal" | "wilson" | "binaryTree";
export type MazeDifficulty = "easy" | "medium" | "hard" | "expert" | "master" | "extreme";
export type MazePaperId = "ansiC" | "ansiD" | "ansiE" | "a3" | "a2" | "a1" | "a0" | "2a0" | "4a0";
export type MazeLocale = "en" | "es" | "fr" | "de" | "pt";
export type MazeColors = { background: string; wall: string; accent: string };
export type MazeSize = { cols?: number; rows?: number };

export type MazeRequest = {
  shape: MazeShape;
  algorithm: MazeAlgorithm;
  difficulty: MazeDifficulty;
  /** Wall width as a percent of a cell. */
  weight: number;
  /** The same seed and settings always give the same maze. */
  seed: number;
  colors: MazeColors;
  cols?: number;
  rows?: number;
  locale?: MazeLocale;
};

export type MazeResult = {
  svg: { maze: string; solution: string };
  shape: string;
  algorithm: string;
  difficulty: string;
  cells: number;
  solutionLength: number;
  deadEnds: number;
  posterCell: Record<MazePaperId, number>;
};
