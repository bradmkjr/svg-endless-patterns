/** The JSON contract with the API's Game of Life routes. */

export type LifePattern = "block" | "beehive" | "loaf" | "tub" | "blinker" | "toad" | "beacon" | "pulsar" | "glider" | "gun" | "noise";
export type LifeNeighborhood = "moore" | "von-neumann";
export type LifeColors = { background: string; primary: string; accent: string };

export type LifeRequest = {
  pattern: LifePattern;
  phase: number;
  cellSize: number;
  columns: number;
  rows: number;
  spacing: number;
  gridLines: boolean;
  neighborhood: LifeNeighborhood;
  cellX: number;
  cellY: number;
  /** Random noise only: which noise. */
  seed?: number;
  colors: LifeColors;
  locale?: "en" | "es" | "fr" | "de" | "pt" | "it" | "nl";
};

export type LifeResult = {
  svg: { sheet: string; tile: string; phases: string; neighborhood: string; animation: string };
  name: string;
  kind: "still-life" | "oscillator" | "spaceship" | "gun" | "soup";
  /** Generations in its loop, or null for noise still changing when the run stops. */
  period: number | null;
  /** Generations before the loop starts: 0 unless noise is still settling. Null if it never repeated. */
  settle: number | null;
  /** Every generation that can be chosen. */
  generations: number;
  /** The generations the animation shows, in order, from the chosen one: at most 15. */
  loop: number[];
  /** Whether the animation's last frame leads straight back to its first. */
  seamless: boolean;
  phaseCells: number[];
  tile: { cols: number; rows: number };
  sheet: { cols: number; rows: number; width: number; height: number; live: number };
  grid: { cols: number; rows: number };
  neighborhood: { kind: string; total: number; live: number; moore: number; vonNeumann: number; alive: boolean; nextAlive: boolean; lines: string[] };
};
