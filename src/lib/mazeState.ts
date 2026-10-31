import { localeAccent } from "./localeAccent";
import type { Locale, MazeAlgorithm, MazeColors, MazeDifficulty, MazeRequest, MazeShape } from "./generator";

/** The maze builder's options, default colors and share links. */

export const SHAPE_OPTIONS: MazeShape[] = ["square", "rectangle", "circle", "hexagon"];
export const ALGORITHM_OPTIONS: MazeAlgorithm[] = ["backtracker", "prim", "kruskal", "wilson", "binaryTree"];
export const DIFFICULTY_OPTIONS: MazeDifficulty[] = ["easy", "medium", "hard", "expert"];
export const WEIGHT_OPTIONS = [6, 10, 15, 20, 30, 40];
export const MAX_SEED = 999999;

const COLORS: MazeColors = { background: "#ffffff", wall: "#1f2933", accent: "#c8553d" };
const DEFAULT_SEED = 7;

export function defaultMazeState(locale: Locale = "en"): MazeRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    shape: "square",
    algorithm: "backtracker",
    difficulty: "medium",
    weight: 15,
    seed: DEFAULT_SEED,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

/** Links never carry a seed: it would make endless pages for search engines to crawl. */
export function parseMazeState(params: { get(name: string): string | null }, locale: Locale = "en"): MazeRequest {
  const base = defaultMazeState(locale);
  return {
    ...base,
    shape: pick(params.get("shape"), SHAPE_OPTIONS, base.shape, (raw) => raw as MazeShape),
    algorithm: pick(params.get("a"), ALGORITHM_OPTIONS, base.algorithm, (raw) => raw as MazeAlgorithm),
    difficulty: pick(params.get("d"), DIFFICULTY_OPTIONS, base.difficulty, (raw) => raw as MazeDifficulty),
    weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight, Number),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      wall: decodeColor(params.get("ln"), base.colors.wall),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
  };
}

export function serializeMazeState(state: MazeRequest): string {
  const base = defaultMazeState(state.locale);
  const params = new URLSearchParams();
  if (state.shape !== base.shape) params.set("shape", state.shape);
  if (state.algorithm !== base.algorithm) params.set("a", state.algorithm);
  if (state.difficulty !== base.difficulty) params.set("d", state.difficulty);
  if (state.weight !== base.weight) params.set("w", String(state.weight));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.wall !== base.colors.wall) params.set("ln", state.colors.wall.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  return params.toString();
}
