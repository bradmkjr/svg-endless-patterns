import type { LifeColors, LifeNeighborhood, LifePattern, LifeRequest, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The Life builder's options, defaults and share links. The patterns themselves live in the API. */

export const PATTERN_OPTIONS: LifePattern[] = ["block", "beehive", "loaf", "tub", "blinker", "toad", "beacon", "pulsar"];
export const NEIGHBORHOOD_OPTIONS: LifeNeighborhood[] = ["moore", "von-neumann"];
export const CELL_SIZE_OPTIONS = [0.125, 0.25, 0.375, 0.5, 0.75, 1];
export const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
/** Starts at two: closer copies would share a neighbor, and affect each other. */
export const SPACING_OPTIONS = [2, 3, 4, 5, 6, 8];

/** How many phases each pattern has. The API enforces the same limits. */
export const LIFE_PERIOD: Record<LifePattern, number> = { block: 1, beehive: 1, loaf: 1, tub: 1, blinker: 2, toad: 2, beacon: 2, pulsar: 3 };
/** The grid a cell can be chosen from: the pattern across all its phases, plus one cell all around. */
export const LIFE_GRID: Record<LifePattern, { cols: number; rows: number }> = {
  block: { cols: 4, rows: 4 },
  beehive: { cols: 6, rows: 5 },
  loaf: { cols: 6, rows: 6 },
  tub: { cols: 5, rows: 5 },
  blinker: { cols: 5, rows: 5 },
  toad: { cols: 6, rows: 6 },
  beacon: { cols: 6, rows: 6 },
  pulsar: { cols: 17, rows: 17 },
};
/** A starting cell for the diagram: where counting 4 and 8 disagree, if there is one. */
const DEFAULT_CELL: Record<LifePattern, [number, number]> = { block: [1, 1], beehive: [2, 1], loaf: [2, 1], tub: [2, 1], blinker: [2, 1], toad: [3, 1], beacon: [2, 2], pulsar: [5, 1] };

const COLORS: LifeColors = { background: "#f7f3ea", primary: "#1f3a5f", accent: "#c8553d" };
const DEFAULT_PATTERN: LifePattern = "pulsar";

export const phaseOptions = (pattern: LifePattern) => Array.from({ length: LIFE_PERIOD[pattern] }, (_, i) => i);
export const columnOptions = (pattern: LifePattern) => Array.from({ length: LIFE_GRID[pattern].cols }, (_, i) => i);
export const rowOptions = (pattern: LifePattern) => Array.from({ length: LIFE_GRID[pattern].rows }, (_, i) => i);

export function defaultLifeState(locale: Locale = "en", pattern: LifePattern = DEFAULT_PATTERN): LifeRequest {
  const large = pattern === "pulsar";
  const [cellX, cellY] = DEFAULT_CELL[pattern];
  return {
    ...(locale === "en" ? {} : { locale }),
    pattern,
    phase: 0,
    cellSize: large ? 0.125 : 0.25,
    columns: large ? 4 : 6,
    rows: large ? 4 : 6,
    spacing: 3,
    gridLines: false,
    neighborhood: "moore",
    cellX,
    cellY,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
  };
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && raw !== "" && options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

export function parseLifeState(params: { get(name: string): string | null }, locale: Locale = "en"): LifeRequest {
  const pattern = PATTERN_OPTIONS.find((p) => p === params.get("p")) ?? DEFAULT_PATTERN;
  const base = defaultLifeState(locale, pattern);
  return {
    ...base,
    phase: pick(params.get("f"), phaseOptions(pattern), base.phase),
    cellSize: pick(params.get("s"), CELL_SIZE_OPTIONS, base.cellSize),
    columns: pick(params.get("c"), COUNT_OPTIONS, base.columns),
    rows: pick(params.get("r"), COUNT_OPTIONS, base.rows),
    spacing: pick(params.get("g"), SPACING_OPTIONS, base.spacing),
    gridLines: params.get("l") === "1",
    neighborhood: NEIGHBORHOOD_OPTIONS.find((n) => n === params.get("n")) ?? base.neighborhood,
    cellX: pick(params.get("x"), columnOptions(pattern), base.cellX),
    cellY: pick(params.get("y"), rowOptions(pattern), base.cellY),
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
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("c1", state.colors.primary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("c2", state.colors.accent.slice(1));
  return params.toString();
}
