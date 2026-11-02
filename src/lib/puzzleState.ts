import { localeAccent } from "./localeAccent";
import type { Locale } from "./generator";
import type { PuzzleColors, PuzzleDifficulty, PuzzlePaper, PuzzleRequest, PuzzleType } from "./puzzleTypes";

/** The paper puzzle builder's options, defaults and share links. */

export const PUZZLE_OPTIONS: PuzzleType[] = ["sudoku", "futoshiki", "nonogram", "battleships", "dots-and-boxes", "ultimate-tic-tac-toe", "hex"];
export const PUZZLE_SIZES: Record<PuzzleType, number[]> = {
  sudoku: [4, 6, 9],
  futoshiki: [4, 5, 6, 7],
  nonogram: [5, 10, 15],
  battleships: [8, 10, 12],
  "dots-and-boxes": [4, 6, 8, 10, 12, 16],
  "ultimate-tic-tac-toe": [3],
  hex: [7, 9, 11, 13],
};
const OPENING_SIZE: Record<PuzzleType, number> = { sudoku: 9, futoshiki: 5, nonogram: 10, battleships: 10, "dots-and-boxes": 8, "ultimate-tic-tac-toe": 3, hex: 11 };
export const DIFFICULTY_OPTIONS: PuzzleDifficulty[] = ["easy", "medium", "hard"];
export const PAPER_OPTIONS: PuzzlePaper[] = ["letter", "a4", "tablet"];
export const MAX_SEED = 999999;

const COLORS: PuzzleColors = { background: "#ffffff", ink: "#1f2933", accent: "#c8553d" };
const DEFAULT_SEED = 7;

export const hasDifficulty = (puzzle: PuzzleType) => puzzle === "sudoku" || puzzle === "futoshiki";
/** Games start blank, so only puzzles have a seed or a solution. */
export const isSolved = (puzzle: PuzzleType) => hasDifficulty(puzzle) || puzzle === "nonogram";

export function defaultPuzzleState(locale: Locale = "en", puzzle: PuzzleType = "sudoku"): PuzzleRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    puzzle,
    size: OPENING_SIZE[puzzle],
    difficulty: "medium",
    seed: DEFAULT_SEED,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
  };
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

/** Links never carry a seed, as with mazes. A size or difficulty the puzzle doesn't have is ignored. */
export function parsePuzzleState(params: { get(name: string): string | null }, locale: Locale = "en"): PuzzleRequest {
  const puzzle = PUZZLE_OPTIONS.find((p) => p === params.get("t")) ?? "sudoku";
  const base = defaultPuzzleState(locale, puzzle);
  const size = Number(params.get("n"));
  return {
    ...base,
    size: PUZZLE_SIZES[puzzle].includes(size) ? size : base.size,
    difficulty: (hasDifficulty(puzzle) && DIFFICULTY_OPTIONS.find((d) => d === params.get("d"))) || base.difficulty,
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      ink: decodeColor(params.get("ln"), base.colors.ink),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
  };
}

export function serializePuzzleState(state: PuzzleRequest): string {
  const base = defaultPuzzleState(state.locale, state.puzzle);
  const params = new URLSearchParams();
  if (state.puzzle !== "sudoku") params.set("t", state.puzzle);
  if (state.size !== base.size) params.set("n", String(state.size));
  if (state.difficulty !== base.difficulty) params.set("d", state.difficulty);
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.ink !== base.colors.ink) params.set("ln", state.colors.ink.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  return params.toString();
}
