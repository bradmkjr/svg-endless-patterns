/** The JSON contract with the API's Game of Life routes. */

export type LifePattern = "block" | "beehive" | "loaf" | "tub" | "blinker" | "toad" | "beacon" | "pulsar";
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
  colors: LifeColors;
  locale?: "en" | "es" | "fr" | "de" | "pt";
};

export type LifeResult = {
  svg: { sheet: string; tile: string; phases: string; neighborhood: string };
  name: string;
  kind: "still-life" | "oscillator";
  period: number;
  phaseCells: number[];
  tile: { cols: number; rows: number };
  sheet: { cols: number; rows: number; width: number; height: number; live: number };
  grid: { cols: number; rows: number };
  neighborhood: { kind: string; total: number; live: number; moore: number; vonNeumann: number; alive: boolean; nextAlive: boolean; lines: string[] };
};
