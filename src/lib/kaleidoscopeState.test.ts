import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/kaleidoscope.json";
import type { KaleidoscopeRequest } from "./generator";
import { defaultKaleidoscopeState, MIRROR_OPTIONS, normalAngle, parseKaleidoscopeState, serializeKaleidoscopeState, SOURCE_OPTIONS } from "./kaleidoscopeState";
import { optionLabel, TOOL_OPTIONS } from "./toolOptions";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const full: KaleidoscopeRequest = { mirrors: "two-mirror", segments: 9, repeats: 6, source: "girih", seed: 7, angle: 271, zoom: 180, offsetX: -35, offsetY: 20, colors: ["#010203", "#a0b0c0"], background: "#ffeedd" };

  it.each(LOCALES)("round trips in %s, and leaves out defaults and the seed", (locale) => {
    const base = defaultKaleidoscopeState(locale);
    expect(serializeKaleidoscopeState(base)).toBe("");
    expect(serializeKaleidoscopeState({ ...base, seed: 1234 })).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseKaleidoscopeState(new URLSearchParams(serializeKaleidoscopeState(state)), locale)).toEqual(state);
  });

  it("reads a seed from an older link", () => {
    expect(parseKaleidoscopeState(new URLSearchParams("seed=42")).seed).toBe(42);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultKaleidoscopeState();
    const bad = "m=hexagon&n=2&r=7&src=tartan&seed=-3&a=360&z=10&x=99&y=-61&c=red,blue&bg=12345";
    expect(parseKaleidoscopeState(new URLSearchParams(bad))).toEqual(base);
    expect(parseKaleidoscopeState(new URLSearchParams("a=12.5&z=1e2&c=" + Array(7).fill("111111").join(",")))).toEqual(base);
    expect(parseKaleidoscopeState(new URLSearchParams("a=45&z=999")).angle).toBe(45);
    expect(parseKaleidoscopeState(new URLSearchParams("a=45&z=999")).zoom).toBe(base.zoom);
  });

  it("varies one default color by language, and keeps the ground and main color", () => {
    const looks = LOCALES.map((l) => defaultKaleidoscopeState(l));
    expect(new Set(looks.map((s) => JSON.stringify(s.colors))).size).toBe(7);
    for (const look of looks) {
      expect(look.background).toBe(looks[0].background);
      expect(look.colors.filter((c, i) => c !== looks[0].colors[i])).toHaveLength(look === looks[0] ? 0 : 1);
      expect(look.colors[0]).toBe(looks[0].colors[0]);
    }
  });

  it("turns any angle into a whole degree from 0 to 359", () => {
    expect([0, 359.6, 360, -1, 725.2, -370].map(normalAngle)).toEqual([0, 0, 0, 359, 5, 350]);
  });
});

describe("option pages", () => {
  it("has a page for every mirror system, named in every language", () => {
    expect(TOOL_OPTIONS.kaleidoscope.options.map((o) => o.slug)).toEqual(MIRROR_OPTIONS);
    for (const locale of LOCALES) {
      const names = MIRROR_OPTIONS.map((slug) => optionLabel("kaleidoscope", slug, locale));
      expect(names.every(Boolean)).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("names every source", () => {
    for (const locale of LOCALES) for (const source of SOURCE_OPTIONS) expect(uiCopy[locale].sourceNames[source]).toBeTruthy();
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it("site text has the same keys and placeholders in every language", () => {
    const english = Object.fromEntries(leaves(uiCopy.en));
    for (const locale of LOCALES) {
      const here = Object.fromEntries(leaves(uiCopy[locale]));
      expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(here)) {
        expect(text.trim(), `${locale}.${key}`).not.toBe("");
        expect(holes(text), `${locale}.${key}`).toEqual(holes(english[key]));
      }
    }
  });
});
