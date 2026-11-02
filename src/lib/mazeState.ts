import copy from "@/i18n/messages/maze.json";
import { localeAccent } from "./localeAccent";
import type { Locale } from "./generator";
import type { MazeAlgorithm, MazeColors, MazeDifficulty, MazeRequest, MazeShape, MazeSize } from "./mazeTypes";

/** The maze builder's options, default colors and share links. */

export const SHAPE_OPTIONS: MazeShape[] = ["square", "rectangle", "circle", "hexagon", "triangle", "diamond", "hidden-message"];
export const ALGORITHM_OPTIONS: MazeAlgorithm[] = ["backtracker", "prim", "kruskal", "wilson", "binaryTree"];
export const DIFFICULTY_OPTIONS: MazeDifficulty[] = ["easy", "medium", "hard", "expert", "master", "extreme"];
/** A hidden message's difficulty sets how wide its letters are, so the largest sizes would only repeat. */
export const MESSAGE_DIFFICULTY_OPTIONS: MazeDifficulty[] = ["easy", "medium", "hard", "expert"];
export const WEIGHT_OPTIONS = [6, 10, 15, 20, 30, 40];
/** Columns and rows on offer. At 400 by 400, a cell prints about 0.15 in wide on the largest sheet. */
export const SIZE_OPTIONS = [5, 8, 10, 12, 16, 20, 24, 30, 36, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400];
/** Longest side of a PNG, in pixels. Browsers can't reliably draw past 16384. */
export const PNG_OPTIONS = [2400, 4800, 8192, 12288, 16384];
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

export const MESSAGE_LIMITS = { characters: 40, words: 6, wordLength: 12 };
export type MessageProblem = "empty" | "characters" | "words" | "wordLength" | "unsupported";

const MESSAGE_CHARACTERS = /^[A-Z0-9ÁÀÂÃÄÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜ.,!¡?¿'\-&+♥ ]*$/;

/** A message as the API's font spells it: capitals, single spaces and straight apostrophes. */
export function normalizeMessage(text: string): string {
  return text.normalize("NFC").replace(/[‘’]/g, "'").replace(/[–—]/g, "-").toUpperCase().replace(/Œ/g, "OE").replace(/Æ/g, "AE").replace(/\s+/g, " ").trim();
}

/** What's wrong with a normalized message, before asking the API, which holds to the same limits. */
export function messageProblem(message: string): MessageProblem | null {
  const words = message.split(" ").filter(Boolean);
  if (!words.length) return "empty";
  if ([...message].length > MESSAGE_LIMITS.characters) return "characters";
  if (words.length > MESSAGE_LIMITS.words) return "words";
  if (words.some((word) => [...word].length > MESSAGE_LIMITS.wordLength)) return "wordLength";
  return MESSAGE_CHARACTERS.test(message) ? null : "unsupported";
}

export const defaultMessage = (locale: Locale = "en") => copy[locale].defaultMessage;

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

function sizeFrom(raw: string | null, key: "cols" | "rows"): MazeSize {
  const value = Number(raw);
  return raw !== null && SIZE_OPTIONS.includes(value) ? { [key]: value } : {};
}

/**
 * Links never carry a seed: it would make endless pages for search engines to crawl. A link can
 * name a hidden message, for a blog sample, but the builder never writes a typed one into its
 * address, where it would give the secret away and reach analytics with the page's URL.
 */
export function parseMazeState(params: { get(name: string): string | null }, locale: Locale = "en"): MazeRequest {
  const base = defaultMazeState(locale);
  if (params.get("shape") === "hidden-message") {
    const message = normalizeMessage(params.get("m") ?? "");
    return {
      ...base,
      shape: "hidden-message",
      message: message && !messageProblem(message) ? message : defaultMessage(locale),
      algorithm: pick(params.get("a"), ALGORITHM_OPTIONS, base.algorithm, (raw) => raw as MazeAlgorithm),
      difficulty: pick(params.get("d"), MESSAGE_DIFFICULTY_OPTIONS, base.difficulty, (raw) => raw as MazeDifficulty),
      weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight, Number),
      colors: {
        background: decodeColor(params.get("bg"), base.colors.background),
        wall: decodeColor(params.get("ln"), base.colors.wall),
        accent: decodeColor(params.get("ac"), base.colors.accent),
      },
    };
  }
  return {
    ...base,
    shape: pick(params.get("shape"), SHAPE_OPTIONS, base.shape, (raw) => raw as MazeShape),
    algorithm: pick(params.get("a"), ALGORITHM_OPTIONS, base.algorithm, (raw) => raw as MazeAlgorithm),
    difficulty: pick(params.get("d"), DIFFICULTY_OPTIONS, base.difficulty, (raw) => raw as MazeDifficulty),
    weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight, Number),
    ...sizeFrom(params.get("cols"), "cols"),
    ...sizeFrom(params.get("rows"), "rows"),
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
  if (state.cols !== undefined) params.set("cols", String(state.cols));
  if (state.rows !== undefined) params.set("rows", String(state.rows));
  if (state.message !== undefined && state.message !== defaultMessage(state.locale)) params.set("m", state.message);
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.wall !== base.colors.wall) params.set("ln", state.colors.wall.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  return params.toString();
}
