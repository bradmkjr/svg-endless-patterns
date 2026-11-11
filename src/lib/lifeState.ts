import type { LifeColors, LifeNeighborhood, LifePattern, LifeRequest, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The Life builder's options, defaults and share links. The patterns themselves live in the API. */

export const PATTERN_OPTIONS: LifePattern[] = ["block", "beehive", "loaf", "tub", "blinker", "toad", "beacon", "pulsar", "glider", "gun", "noise"];
export const NEIGHBORHOOD_OPTIONS: LifeNeighborhood[] = ["moore", "von-neumann"];
export const CELL_SIZE_OPTIONS = [0.125, 0.25, 0.375, 0.5, 0.75, 1];
export const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
/** Starts at two: closer copies would share a neighbor, and affect each other. */
export const SPACING_OPTIONS = [2, 3, 4, 5, 6, 8];
/** The most generations the API runs. Noise still changing then stops there. */
export const MAX_GENERATIONS = 64;
export const SEED_MAX = 999999;
const DEFAULT_SEED = 1;

/**
 * Patterns that run on their tile with its edges joined, and how many cells across they are before
 * the spacing is added. The tile, and so the grid and the run, grow with the spacing.
 */
export const WRAPPING: Partial<Record<LifePattern, number>> = { glider: 3, noise: 8 };
export const wraps = (pattern: LifePattern) => WRAPPING[pattern] !== undefined;

/** How many generations each open pattern has. The API enforces the same limits. */
const OPEN_GENERATIONS: Partial<Record<LifePattern, number>> = { block: 1, beehive: 1, loaf: 1, tub: 1, blinker: 2, toad: 2, beacon: 2, pulsar: 3, gun: 30 };
/** The grid a cell can be chosen from: the pattern across all its phases, plus one cell all around. */
const OPEN_GRID: Partial<Record<LifePattern, { cols: number; rows: number }>> = {
  block: { cols: 4, rows: 4 },
  beehive: { cols: 6, rows: 5 },
  loaf: { cols: 6, rows: 6 },
  tub: { cols: 5, rows: 5 },
  blinker: { cols: 5, rows: 5 },
  toad: { cols: 6, rows: 6 },
  beacon: { cols: 6, rows: 6 },
  pulsar: { cols: 17, rows: 17 },
  gun: { cols: 41, rows: 27 },
};

/**
 * Generations that can be chosen. A glider comes home after 4 generations for each cell across its
 * tile. Noise is known only once the API has run it, so until then any generation it might reach.
 */
export function lifeGenerations(pattern: LifePattern, spacing: number): number {
  if (pattern === "glider") return 4 * (WRAPPING.glider! + spacing);
  if (pattern === "noise") return MAX_GENERATIONS;
  return OPEN_GENERATIONS[pattern]!;
}

/** The grid a cell can be chosen from: an open pattern with a cell of margin, or a wrapping tile. */
export function lifeGrid(pattern: LifePattern, spacing: number): { cols: number; rows: number } {
  const base = WRAPPING[pattern];
  return base === undefined ? OPEN_GRID[pattern]! : { cols: base + spacing, rows: base + spacing };
}

/** A starting cell for the diagram: where counting 4 and 8 disagree, if there is one. */
const DEFAULT_CELL: Record<LifePattern, [number, number]> = { block: [1, 1], beehive: [2, 1], loaf: [2, 1], tub: [2, 1], blinker: [2, 1], toad: [3, 1], beacon: [2, 2], pulsar: [5, 1], glider: [2, 2], gun: [25, 2], noise: [5, 5] };
/** Sizes that make a sheet of reasonable size: small cells for the big patterns. */
const DEFAULT_LAYOUT: Partial<Record<LifePattern, { cellSize: number; columns: number; rows: number }>> = {
  pulsar: { cellSize: 0.125, columns: 4, rows: 4 },
  gun: { cellSize: 0.125, columns: 1, rows: 1 },
  noise: { cellSize: 0.25, columns: 3, rows: 3 },
};

const COLORS: LifeColors = { background: "#f7f3ea", primary: "#1f3a5f", accent: "#c8553d" };
const DEFAULT_PATTERN: LifePattern = "pulsar";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
export const phaseOptions = (pattern: LifePattern, spacing = 3, known?: number) => range(known ?? lifeGenerations(pattern, spacing));
export const columnOptions = (pattern: LifePattern, spacing = 3) => range(lifeGrid(pattern, spacing).cols);
export const rowOptions = (pattern: LifePattern, spacing = 3) => range(lifeGrid(pattern, spacing).rows);
export const randomSeed = () => Math.floor(Math.random() * (SEED_MAX + 1));

export function defaultLifeState(locale: Locale = "en", pattern: LifePattern = DEFAULT_PATTERN): LifeRequest {
  const [cellX, cellY] = DEFAULT_CELL[pattern];
  return {
    ...(locale === "en" ? {} : { locale }),
    pattern,
    phase: 0,
    cellSize: 0.25,
    columns: 6,
    rows: 6,
    ...DEFAULT_LAYOUT[pattern],
    spacing: 3,
    gridLines: false,
    neighborhood: "moore",
    cellX,
    cellY,
    ...(pattern === "noise" ? { seed: DEFAULT_SEED } : {}),
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
  };
}

/**
 * Settings after a change to the spacing or seed. On a wrapping tile they change the run and the
 * grid, so the phase starts over and the chosen cell stays on the grid.
 */
export function withRun(state: LifeRequest, patch: Pick<Partial<LifeRequest>, "spacing" | "seed">): LifeRequest {
  const next = { ...state, ...patch };
  if (!wraps(state.pattern)) return next;
  const grid = lifeGrid(next.pattern, next.spacing);
  return { ...next, phase: 0, cellX: Math.min(next.cellX, grid.cols - 1), cellY: Math.min(next.cellY, grid.rows - 1) };
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && raw !== "" && options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

function decodeSeed(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return raw && /^\d+$/.test(raw) && value <= SEED_MAX ? value : fallback;
}

export function parseLifeState(params: { get(name: string): string | null }, locale: Locale = "en"): LifeRequest {
  const pattern = PATTERN_OPTIONS.find((p) => p === params.get("p")) ?? DEFAULT_PATTERN;
  const base = defaultLifeState(locale, pattern);
  const spacing = pick(params.get("g"), SPACING_OPTIONS, base.spacing);
  return {
    ...base,
    phase: pick(params.get("f"), phaseOptions(pattern, spacing), base.phase),
    cellSize: pick(params.get("s"), CELL_SIZE_OPTIONS, base.cellSize),
    columns: pick(params.get("c"), COUNT_OPTIONS, base.columns),
    rows: pick(params.get("r"), COUNT_OPTIONS, base.rows),
    spacing,
    gridLines: params.get("l") === "1",
    neighborhood: NEIGHBORHOOD_OPTIONS.find((n) => n === params.get("n")) ?? base.neighborhood,
    cellX: pick(params.get("x"), columnOptions(pattern, spacing), Math.min(base.cellX, lifeGrid(pattern, spacing).cols - 1)),
    cellY: pick(params.get("y"), rowOptions(pattern, spacing), Math.min(base.cellY, lifeGrid(pattern, spacing).rows - 1)),
    ...(base.seed === undefined ? {} : { seed: decodeSeed(params.get("seed"), base.seed) }),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      primary: decodeColor(params.get("c1"), base.colors.primary),
      accent: decodeColor(params.get("c2"), base.colors.accent),
    },
  };
}

export function serializeLifeState(state: LifeRequest): string {
  const base = defaultLifeState(state.locale, state.pattern);
  const params = new URLSearchParams();
  if (state.pattern !== DEFAULT_PATTERN) params.set("p", state.pattern);
  if (state.phase !== base.phase) params.set("f", String(state.phase));
  if (state.cellSize !== base.cellSize) params.set("s", String(state.cellSize));
  if (state.columns !== base.columns) params.set("c", String(state.columns));
  if (state.rows !== base.rows) params.set("r", String(state.rows));
  if (state.spacing !== base.spacing) params.set("g", String(state.spacing));
  if (state.gridLines) params.set("l", "1");
  if (state.neighborhood !== base.neighborhood) params.set("n", state.neighborhood);
  if (state.cellX !== base.cellX) params.set("x", String(state.cellX));
  if (state.cellY !== base.cellY) params.set("y", String(state.cellY));
  if (state.seed !== undefined && state.seed !== base.seed) params.set("seed", String(state.seed));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("c1", state.colors.primary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("c2", state.colors.accent.slice(1));
  return params.toString();
}
