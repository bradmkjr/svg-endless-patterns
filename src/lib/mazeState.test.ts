import { describe, expect, it } from "vitest";
import copy from "@/i18n/messages/maze.json";
import { ALGORITHM_OPTIONS, defaultMazeState, defaultMessage, DIFFICULTY_OPTIONS, MESSAGE_LIMITS, messageProblem, normalizeMessage, parseMazeState, serializeMazeState, SHAPE_OPTIONS, SIZE_OPTIONS, WEIGHT_OPTIONS } from "./mazeState";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

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

  it.each(LOCALES)("opens a hidden message on a usable message in %s", (locale) => {
    const state = parseMazeState(new URLSearchParams("shape=hidden-message"), locale);
    expect(state.message).toBe(defaultMessage(locale));
    expect(defaultMessage(locale)).toBe(normalizeMessage(defaultMessage(locale)));
    expect(messageProblem(defaultMessage(locale))).toBeNull();
    expect(serializeMazeState(state)).toBe("shape=hidden-message");
  });

  it("reads a named message, and ignores sizes and a message it can't draw", () => {
    const state = parseMazeState(new URLSearchParams("shape=hidden-message&m=happy+birthday&cols=50&rows=50&d=extreme"));
    expect(state).toMatchObject({ message: "HAPPY BIRTHDAY", difficulty: "medium" });
    expect(state.cols).toBeUndefined();
    expect(serializeMazeState(state)).toBe("shape=hidden-message&m=HAPPY+BIRTHDAY");
    expect(parseMazeState(new URLSearchParams("shape=hidden-message&m=%3Cscript%3E")).message).toBe(defaultMessage());
    expect(parseMazeState(new URLSearchParams("m=HELLO")).message).toBeUndefined();
  });

  it("holds a message to the same limits as the API", () => {
    expect(messageProblem("")).toBe("empty");
    expect(messageProblem("A".repeat(MESSAGE_LIMITS.wordLength + 1))).toBe("wordLength");
    expect(messageProblem("A B C D E F G")).toBe("words");
    expect(messageProblem("ABCDEFGHIJKL ABCDEFGHIJKL ABCDEFGHIJKL ABCD")).toBe("characters");
    expect(messageProblem("HI <B>")).toBe("unsupported");
    expect(messageProblem(normalizeMessage("¿qué tal, año?"))).toBeNull();
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
