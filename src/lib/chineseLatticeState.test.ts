import { describe, expect, it } from "vitest";
import copy from "../i18n/messages/chineseLattice.json";
import type { ChineseLatticeRequest } from "./generator";
import { defaultChineseLatticeState, FRAMEWORK_OPTIONS, parseChineseLatticeState, serializeChineseLatticeState } from "./chineseLatticeState";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("%s defaults leave an empty query", (locale) => {
    expect(serializeChineseLatticeState(defaultChineseLatticeState(locale))).toBe("");
    expect(parseChineseLatticeState(params(""), locale)).toEqual(defaultChineseLatticeState(locale));
  });

  it("changes only the frame color by language", () => {
    const en = defaultChineseLatticeState("en");
    for (const locale of LOCALES) {
      const here = defaultChineseLatticeState(locale);
      expect(here.colors.background).toBe(en.colors.background);
      expect(here.colors.line).toBe(en.colors.line);
    }
  });

  it("round trips every setting but the seed", () => {
    const state: ChineseLatticeRequest = { framework: "octagon-square", barWidth: 10, density: 3, depth: 2, edge: "open", seed: 7, colors: { background: "#010203", line: "#040506", accent: "#070809" }, repeatWidth: 12, across: 5, down: 1 };
    expect(parseChineseLatticeState(params(serializeChineseLatticeState(state)))).toEqual(state);
  });

  it("reads a seed from a link but never writes one", () => {
    const state = parseChineseLatticeState(params("seed=42"));
    expect(state.seed).toBe(42);
    expect(serializeChineseLatticeState(state)).toBe("");
  });

  it("falls back on bad input", () => {
    const fallback = defaultChineseLatticeState();
    expect(parseChineseLatticeState(params("f=wan&bar=7&d=9&nest=-1&edge=x&seed=abc&bg=zzz&w=-1&x=0&y=abc"))).toEqual(fallback);
    expect(parseChineseLatticeState(params("f=&bar=&d="))).toEqual(fallback);
  });
});

describe("site text", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries((value ?? {}) as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it.each(LOCALES)("%s matches English, with every framework named", (locale) => {
    const english = Object.fromEntries(leaves(copy.en));
    const here = Object.fromEntries(leaves(copy[locale]));
    expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
    for (const [key, text] of Object.entries(here)) {
      expect(text.trim(), key).not.toBe("");
      expect(holes(text), key).toEqual(holes(english[key]));
    }
    for (const framework of FRAMEWORK_OPTIONS) expect(copy[locale].frameworks[framework]).toBeTruthy();
  });

  it("never offers the wan fret", () => {
    expect(JSON.stringify(copy)).not.toMatch(/\bwan\b|卍|swastika/i);
  });
});
