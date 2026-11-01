import type { CheckerboardRequest, CheckerPattern, Locale } from "./generator";

/** The checkerboard builder's options, defaults and share links. */

export const PATTERN_OPTIONS: CheckerPattern[] = ["checker", "brick", "half-drop", "gingham", "hexagon", "triangle"];
export const COUNT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30, 36, 40, 50, 60, 80, 100];
export const RATIO_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
export const UNIT_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 6];
/** Common box shapes, width then height. */
export const RATIO_PRESETS: [number, number][] = [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [2, 3]];
export const MIN_COLORS = 2;
export const MAX_COLORS = 4;
const SPARE_COLORS = ["#b3403a", "#2f6f73"];
/** Black and cream, the same in every language: a board has no secondary color for one to change. */
const COLORS = ["#25221c", "#f4ecdc"];

export function defaultCheckerboardState(locale: Locale = "en"): CheckerboardRequest {
  return { ...(locale === "en" ? {} : { locale }), pattern: "checker", cols: 8, rows: 8, ratioWidth: 1, ratioHeight: 1, unit: 1, colors: COLORS };
}

/** Patterns drawn as true shapes, where a 1:1 ratio is regular and any other stretches them. */
export const isShapePattern = (pattern: CheckerPattern) => pattern === "hexagon" || pattern === "triangle";

/** Colors a pattern can show. A gingham mixes two; a honeycomb needs just three, so no two neighbors match. */
export function maxColors(pattern: CheckerPattern): number {
  if (pattern === "gingham") return MIN_COLORS;
  return pattern === "hexagon" ? 3 : MAX_COLORS;
}

/** A board's shape while it's drawn, as width over height. Hexagon and triangle rows are shorter than they are wide. */
export function boardAspect({ pattern, cols, rows, ratioWidth, ratioHeight }: CheckerboardRequest): number {
  return (cols * ratioWidth) / (rows * ratioHeight * (isShapePattern(pattern) ? Math.sqrt(3) / 2 : 1));
}

/** The next color for a board that gains one. */
export const spareColor = (count: number) => SPARE_COLORS[count - MIN_COLORS] ?? "#888888";

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

function decodeColors(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length < MIN_COLORS || parts.length > MAX_COLORS || !parts.every((part) => /^[0-9a-f]{6}$/i.test(part))) return null;
  return parts.map((part) => `#${part.toLowerCase()}`);
}

/** A ratio from a link, read as `3-1`. Both sides have to be on offer, or it's ignored. */
function decodeRatio(raw: string | null): [number, number] | null {
  const parts = raw?.split("-").map(Number);
  return parts?.length === 2 && parts.every((part) => RATIO_OPTIONS.includes(part)) ? [parts[0], parts[1]] : null;
}

export function parseCheckerboardState(params: { get(name: string): string | null }, locale: Locale = "en"): CheckerboardRequest {
  const base = defaultCheckerboardState(locale);
  const [ratioWidth, ratioHeight] = decodeRatio(params.get("ratio")) ?? [base.ratioWidth, base.ratioHeight];
  return {
    ...base,
    pattern: PATTERN_OPTIONS.find((p) => p === params.get("p")) ?? base.pattern,
    cols: pick(params.get("c"), COUNT_OPTIONS, base.cols),
    rows: pick(params.get("r"), COUNT_OPTIONS, base.rows),
    ratioWidth,
    ratioHeight,
    unit: pick(params.get("u"), UNIT_OPTIONS, base.unit),
    colors: decodeColors(params.get("k")) ?? base.colors,
  };
}

export function serializeCheckerboardState(state: CheckerboardRequest): string {
  const base = defaultCheckerboardState(state.locale);
  const params = new URLSearchParams();
  const hex = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");
  if (state.pattern !== base.pattern) params.set("p", state.pattern);
  if (state.cols !== base.cols) params.set("c", String(state.cols));
  if (state.rows !== base.rows) params.set("r", String(state.rows));
  if (state.ratioWidth !== base.ratioWidth || state.ratioHeight !== base.ratioHeight) params.set("ratio", `${state.ratioWidth}-${state.ratioHeight}`);
  if (state.unit !== base.unit) params.set("u", String(state.unit));
  if (hex(state.colors) !== hex(base.colors)) params.set("k", hex(state.colors));
  return params.toString();
}
