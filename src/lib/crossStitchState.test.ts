import { describe, expect, it } from "vitest";
import {     defaultCrossStitchState,   DEFAULT_COUNT,   MAX_GRID,     MOTIFS,   parseCrossStitchState,     resizeGrid,   serializeCrossStitchState,   setCell, } from "./crossStitchState";
import type { CrossStitchRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;


const params = (query: string) => new URLSearchParams(query);

describe("complete designs", () => {
  const designs = MOTIFS.slice(6);

  it("offers at least six", () => {
    expect(designs.length).toBeGreaterThanOrEqual(6);
  });

});

describe("share links", () => {
  it("are empty for the default, in every language", () => {
    for (const locale of LOCALES) expect(serializeCrossStitchState(defaultCrossStitchState(locale))).toBe("");
  });

  it("give each language its own opening colors", () => {
    const colors = LOCALES.map((locale) => defaultCrossStitchState(locale).colors.join());
    expect(new Set(colors).size).toBe(LOCALES.length);
  });

  it.each(LOCALES)("round trip every setting in %s", (locale) => {
    const base = defaultCrossStitchState(locale);
    const states: CrossStitchRequest[] = [
      { ...base, count: 18, strands: 3, margin: 5, fabric: "#222222" },
      { ...base, count: DEFAULT_COUNT, finish: "pillow" },
      { ...base, grid: MOTIFS[MOTIFS.length - 1].grid, colors: MOTIFS[MOTIFS.length - 1].colors, finish: "pillow", margin: 1 },
      { ...base, colors: ["#101010", "#202020", "#303030", "#404040"] },
      { ...base, grid: MOTIFS[3].grid, colors: MOTIFS[3].colors },
      { ...base, grid: setCell(base.grid, 0, 0, "c") },
      { ...base, grid: resizeGrid(base.grid, MAX_GRID, MAX_GRID) },
      { ...base, grid: resizeGrid([], 8, 8), colors: ["#101010"] },
    ];
    for (const state of states) {
      expect(parseCrossStitchState(params(serializeCrossStitchState(state)), locale)).toEqual(state);
    }
  });

  it("name a motif rather than spelling out its grid", () => {
    expect(serializeCrossStitchState({ ...defaultCrossStitchState(), grid: MOTIFS[1].grid, colors: MOTIFS[1].colors })).toBe("m=heart");
  });

  it.each(["m=heart", "m=pine&count=18", "m=compassRose&finish=pillow", "m=diamonds&c=7a4b9a-2f8f9d-1a1a1a"])("keep the deep link %s", (query) => {
    expect(serializeCrossStitchState(parseCrossStitchState(params(query)))).toBe(query);
  });

  it.each(["count=15", "count=abc", "strands=5", "margin=99", "f=zzz", "m=nope", "c=notcolor", "c=", "g=xyz", "g=99999999a", "g=8a-8a", "g=8a-7a-8a-8a-8a-8a-8a-8a", "g=0a", "craft=knit", "count=10", "finish=shelf"])(
    "fall back to the default on the bad value %s",
    (query) => {
      expect(parseCrossStitchState(params(query))).toEqual(defaultCrossStitchState());
    },
  );

  it("keep the good settings when another is bad", () => {
    const state = parseCrossStitchState(params("count=18&strands=5&m=nope"));
    expect(state).toEqual({ ...defaultCrossStitchState(), count: 18 });
  });

});

describe("grid editing", () => {
  it("paints one cell", () => {
    expect(setCell(["....", "...."], 1, 2, "b")).toEqual(["....", "..b."]);
  });

  it("resizes from the top left, filling with bare fabric", () => {
    expect(resizeGrid(["ab", "cd"], 3, 3)).toEqual(["ab.", "cd.", "..."]);
    expect(resizeGrid(["abc", "def", "ghc"], 2, 1)).toEqual(["ab"]);
  });

});
