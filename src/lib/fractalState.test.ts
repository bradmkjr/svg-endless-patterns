import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/fractal.json";
import { ANGLE_OPTIONS, defaultFractalState, depthOptions, FRACTAL_MAX_DEPTH, parseFractalState, serializeFractalState, TYPE_OPTIONS, WEIGHT_OPTIONS } from "./fractalState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseFractalState(new URLSearchParams(query), locale);

  it.each(LOCALES)("has an empty link for the %s defaults", (locale) => {
    expect(serializeFractalState(defaultFractalState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultFractalState(locale));
  });

  it("round trips every setting", () => {
    for (const type of TYPE_OPTIONS) {
      const state = { ...defaultFractalState("en", type), depth: 2, weight: WEIGHT_OPTIONS[0], angle: ANGLE_OPTIONS[0], colors: { background: "#010203", primary: "#a0b0c0", accent: "#ffeedd" } };
      expect(parse(serializeFractalState(state))).toEqual(state);
    }
  });

  it.each(["t=mandelbrot", "d=99", "d=0", "d=2.5", "w=5", "a=7", "bg=red", "c1=12345", "c2=%22"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultFractalState());
  });

  it("keeps a depth only if its type offers it", () => {
    expect(parse("t=sierpinski-carpet&d=14").depth).toBe(defaultFractalState("en", "sierpinski-carpet").depth);
    expect(parse("t=dragon-curve&d=14").depth).toBe(14);
  });

  it("changes one color by language", () => {
    for (const locale of LOCALES) {
      expect(defaultFractalState(locale).colors.primary).toBe(defaultFractalState().colors.primary);
      expect(defaultFractalState(locale).colors.background).toBe(defaultFractalState().colors.background);
    }
  });

  it("offers what the engine draws, with no seed", () => {
    for (const type of TYPE_OPTIONS) expect(Math.max(...depthOptions(type))).toBe(FRACTAL_MAX_DEPTH[type]);
    expect(serializeFractalState(defaultFractalState())).not.toContain("seed");
  });
});

describe("translation", () => {
  const flat = (value: object, prefix = ""): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
    const english = flat(uiText.en);
    const text = flat(uiText[locale]);
    expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
    for (const [name, value] of Object.entries(english)) {
      expect(text[name], name).toBeTruthy();
      expect(placeholders(text[name]), name).toEqual(placeholders(value));
    }
  });
});
