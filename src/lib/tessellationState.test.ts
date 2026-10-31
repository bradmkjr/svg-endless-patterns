import { describe, expect, it } from "vitest";
import type { Locale } from "./generator";
import siteText from "../i18n/messages/tessellation.json";
import { defaultTessellationState, parseTessellationState, serializeTessellationState } from "./tessellationState";

const LOCALE_CODES: Locale[] = ["en", "es", "fr", "de", "pt"];


describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it("leaves out defaults, so links stay short", () => {
    expect(serializeTessellationState({ ...defaultTessellationState(), group: "p6m" })).toBe("g=p6m");
  });

  it("falls back on bad input", () => {
    const base = defaultTessellationState();
    const bad = parseTessellationState(params("m=dragon&g=p7&bg=red&c1=12345&c2=%23aabbcc&w=7&x=0&y=99&lines=yes"));
    expect(bad).toEqual(base);
    expect(parseTessellationState(params("w=NaN&x=1e9&y=-1&g=__proto__&m=constructor"))).toEqual(base);
  });

  it("has a different default palette in each language", () => {
    const palettes = LOCALE_CODES.map((locale) => JSON.stringify(defaultTessellationState(locale).colors));
    expect(new Set(palettes).size).toBe(5);
  });
});

describe("translations", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  /** Every string in a catalog, by its path. */
  const flatten = (value: unknown, path = ""): [string, string][] => {
    if (typeof value === "string") return [[path, value]];
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => flatten(child, `${path}.${key}`));
  };

  describe.each([["site", siteText]] as const)("%s catalog", (_, catalog) => {
    it.each(LOCALE_CODES)("%s matches English in its keys and placeholders", (locale) => {
      const english = new Map(flatten(catalog.en));
      const here = new Map(flatten(catalog[locale]));
      expect([...here.keys()].sort()).toEqual([...english.keys()].sort());
      for (const [key, text] of here) {
        expect(text.trim(), key).not.toBe("");
        expect(placeholders(text), key).toEqual(placeholders(english.get(key)!));
      }
    });
  });

});
