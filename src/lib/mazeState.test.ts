import { describe, expect, it } from "vitest";
import copy from "@/i18n/messages/maze.json";
import { ALGORITHM_OPTIONS, defaultMazeState, DIFFICULTY_OPTIONS, parseMazeState, serializeMazeState, SHAPE_OPTIONS, SIZE_OPTIONS, WEIGHT_OPTIONS } from "./mazeState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("maze share links", () => {
  it.each(LOCALES)("round trips the defaults and options in %s", (locale) => {
    const base = defaultMazeState(locale);
    expect(serializeMazeState(base)).toBe("");
    const complete = {
      ...base,
      shape: "hexagon" as const,
      algorithm: "wilson" as const,
      difficulty: "expert" as const,
      weight: 40,
      cols: 50,
      rows: 300,
      colors: { background: "#010203", wall: "#a0b0c0", accent: "#ffeedd" },
    };
    expect(parseMazeState(new URLSearchParams(serializeMazeState(complete)), locale)).toEqual(complete);
  });

  it("omits seeds and ignores malformed or unsupported values", () => {
    const base = defaultMazeState();
    expect(serializeMazeState({ ...base, seed: 12345 })).toBe("");
    expect(parseMazeState(new URLSearchParams("seed=12345"))).toEqual(base);
    expect(parseMazeState(new URLSearchParams("shape=star&a=magic&d=impossible&w=999&bg=red&cols=401"))).toEqual(base);
    expect(parseMazeState(new URLSearchParams("shape=circle&w=999")).shape).toBe("circle");
  });

  it("keeps all choice labels aligned with each language's maze catalog", () => {
    for (const locale of LOCALES) {
      for (const shape of SHAPE_OPTIONS) expect(copy[locale].shapes[shape]).toBeTruthy();
      for (const algorithm of ALGORITHM_OPTIONS) expect(copy[locale].algorithms[algorithm]).toBeTruthy();
      for (const difficulty of DIFFICULTY_OPTIONS) expect(copy[locale].difficulties[difficulty]).toBeTruthy();
    }
    expect(SIZE_OPTIONS.at(-1)).toBe(400);
    expect(WEIGHT_OPTIONS).toContain(40);
  });
});
