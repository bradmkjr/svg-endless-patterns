import { describe, expect, it } from "vitest";
import copy from "@/i18n/messages/braid.json";
import { braidRequest, defaultBraidState, normalizeBraid, parseBraidState, PATTERN_OPTIONS, PATTERNS, serializeBraidState } from "./braidState";
import { TOOL_OPTIONS } from "./toolOptions";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("braid state", () => {
  it("leaves out every default", () => {
    for (const pattern of PATTERN_OPTIONS) expect(serializeBraidState(defaultBraidState("en", pattern))).toBe(pattern === "chevron" ? "" : `p=${pattern}`);
  });

  it("round-trips every setting", () => {
    const state = { ...defaultBraidState("en", "candy-stripe"), strands: 8, colors: ["#111111", "#222222", "#333333"], repeats: 4, view: "chart" as const };
    expect(parseBraidState(new URLSearchParams(serializeBraidState(state)))).toEqual(state);
  });

  it("falls back to the pattern's own strands and colors", () => {
    const state = parseBraidState(new URLSearchParams("p=three-strand&n=8&c=111111-222222-333333-444444-555555&r=99&v=x"));
    expect(state.strands).toBe(3);
    expect(state.colors).toEqual(defaultBraidState("en", "three-strand").colors);
    expect(state.repeats).toBe(2);
    expect(state.view).toBe("braid");
    expect(normalizeBraid({ ...defaultBraidState("en", "diamond"), colors: ["#111111", "#222222", "#333333"] }).colors).toHaveLength(2);
  });

  it("asks the API for every setting but the view", () => {
    expect(braidRequest(defaultBraidState("fr"))).toEqual({ locale: "fr", pattern: "chevron", strands: 12, colors: defaultBraidState("fr").colors, repeats: 2 });
  });

  it("changes only the second color by language", () => {
    for (const locale of LOCALES) {
      const [first, , ...rest] = defaultBraidState(locale, "candy-stripe").colors;
      expect([first, ...rest]).toEqual(["#e5383b", "#f6c945", "#4caf6a", "#2f80c9", "#7b4bb7"]);
      expect(defaultBraidState(locale, "heart").colors[0]).toBe("#2f80c9");
    }
  });

  it("names and describes every pattern in every language", () => {
    expect(TOOL_OPTIONS.braid.options.map((o) => o.value)).toEqual(PATTERN_OPTIONS);
    for (const locale of LOCALES) {
      for (const pattern of PATTERN_OPTIONS) {
        expect(copy[locale].patterns[pattern]).toBeTruthy();
        expect(copy[locale].patternNotes[pattern]).toBeTruthy();
      }
      expect(Object.keys(copy[locale]).sort()).toEqual(Object.keys(copy.en).sort());
    }
    for (const pattern of PATTERN_OPTIONS) expect(PATTERNS[pattern].strands.length).toBeGreaterThan(0);
  });
});
