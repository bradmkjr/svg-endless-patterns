import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/puzzle.json";
import { defaultPuzzleState, DIFFICULTY_OPTIONS, hasDifficulty, isSolved, PAPER_OPTIONS, parsePuzzleState, PUZZLE_OPTIONS, PUZZLE_SIZES, serializePuzzleState } from "./puzzleState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const parse = (query: string, locale?: (typeof LOCALES)[number]) => parsePuzzleState(new URLSearchParams(query), locale);

describe("share links", () => {
  it.each(LOCALES)("has an empty link for the opening sudoku in %s", (locale) => {
    expect(serializePuzzleState(defaultPuzzleState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultPuzzleState(locale));
  });

  it.each(PUZZLE_OPTIONS)("opens %s at a size it offers, naming only the type", (puzzle) => {
    const state = defaultPuzzleState("en", puzzle);
    expect(PUZZLE_SIZES[puzzle]).toContain(state.size);
    expect(parse(serializePuzzleState(state))).toEqual(state);
    expect(serializePuzzleState(state)).toBe(puzzle === "sudoku" ? "" : `t=${puzzle}`);
  });

  it("round trips every setting, but never the seed", () => {
    const state = { ...defaultPuzzleState(), puzzle: "futoshiki" as const, size: 7, difficulty: "hard" as const, colors: { background: "#fafafa", ink: "#123456", accent: "#abcdef" } };
    expect(parse(serializePuzzleState(state))).toEqual(state);
    expect(serializePuzzleState({ ...state, seed: 99 })).not.toContain("99");
    expect(parse("seed=99").seed).toBe(defaultPuzzleState().seed);
  });

  it.each(["t=crossword", "n=5", "n=abc", "d=evil", "bg=red", "ln=zzzzzz", "ac=12345"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultPuzzleState());
  });

  it("drops another puzzle's size and a difficulty the puzzle lacks", () => {
    expect(parse("t=hex&n=9").size).toBe(9);
    expect(parse("t=hex&n=4").size).toBe(defaultPuzzleState("en", "hex").size);
    expect(serializePuzzleState(parse("t=hex&d=hard"))).toBe("t=hex");
  });

  it("gives each language its own accent and the same ink", () => {
    for (const locale of LOCALES) expect(defaultPuzzleState(locale).colors.ink).toBe(defaultPuzzleState().colors.ink);
    expect(defaultPuzzleState("es").colors.accent).not.toBe(defaultPuzzleState("de").colors.accent);
  });
});

describe("which puzzles have what", () => {
  it("gives games no solution, and only number grids a difficulty", () => {
    expect(PUZZLE_OPTIONS.filter(isSolved)).toEqual(["sudoku", "futoshiki", "nonogram"]);
    expect(PUZZLE_OPTIONS.filter(hasDifficulty)).toEqual(["sudoku", "futoshiki"]);
  });
});

describe("translation", () => {
  const shape = (value: unknown): unknown => (typeof value === "object" && value ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()));

  it.each(LOCALES)("has the same keys and placeholders in %s", (locale) => {
    expect(shape(uiText[locale])).toEqual(shape(uiText.en));
  });

  it.each(LOCALES)("names every option in %s", (locale) => {
    const t = uiText[locale];
    for (const id of PUZZLE_OPTIONS) {
      expect(t.types[id]).toBeTruthy();
      expect(t.blurbs[id]).toBeTruthy();
    }
    for (const id of DIFFICULTY_OPTIONS) expect(t.difficulties[id]).toBeTruthy();
    for (const id of PAPER_OPTIONS) expect(t.papers[id]).toBeTruthy();
  });
});
