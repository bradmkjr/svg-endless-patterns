import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/kolam.json";
import { defaultKolamState, FORM_OPTIONS, parseKolamState, serializeKolamState, SIZE_OPTIONS } from "./kolamState";
import { TOOL_OPTIONS } from "./toolOptions";
import type { KolamRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const full: KolamRequest = { form: "kambi", grid: "hexagonal", size: 13, rule: "random", line: "double", dots: false, weight: 12, seed: 7, colors: { background: "#010203", line: "#a0b0c0", accent: "#ffeedd" }, repeatWidth: 7.5 };

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    expect(serializeKolamState(defaultKolamState(locale))).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseKolamState(new URLSearchParams(serializeKolamState(state)), locale)).toEqual(state);
  });

  it("keeps the seed out of the link", () => {
    expect(serializeKolamState({ ...defaultKolamState(), seed: 123 })).toBe("");
  });

  it("offers only odd sizes, so a square repeat has a center dot", () => {
    for (const size of SIZE_OPTIONS) expect(size % 2).toBe(1);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultKolamState();
    expect(parseKolamState(new URLSearchParams("f=rangoli&g=triangle&n=8&rule=x&l=triple&dots=yes&w=99&seed=-3&bg=red&ln=12345&ac=gggggg&r=100"))).toEqual(base);
    expect(parseKolamState(new URLSearchParams("n=11&w=999")).size).toBe(11);
    expect(parseKolamState(new URLSearchParams("n=11&w=999")).weight).toBe(base.weight);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => JSON.stringify(defaultKolamState(l).colors))).size).toBe(7);
  });

  it("has a page for each form", () => {
    expect(TOOL_OPTIONS.kolam.options.map((o) => o.slug)).toEqual(FORM_OPTIONS);
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it("has the same keys and placeholders in every language", () => {
    const english = Object.fromEntries(leaves(uiCopy.en));
    for (const locale of LOCALES) {
      const here = Object.fromEntries(leaves(uiCopy[locale]));
      expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(here)) {
        expect(text.trim()).not.toBe("");
        expect(holes(text)).toEqual(holes(english[key]));
      }
    }
  });

  it("keeps the Tamil names and never calls kolam rangoli", () => {
    for (const locale of LOCALES) {
      expect(JSON.stringify(uiCopy[locale])).not.toMatch(/rangoli/i);
      for (const form of FORM_OPTIONS) expect(uiCopy[locale].forms[form].toLowerCase()).toContain(form);
    }
  });
});
