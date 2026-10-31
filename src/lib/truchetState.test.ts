import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/truchet.json";
import { defaultTruchetState, GRID_OPTIONS, parseTruchetState, serializeTruchetState } from "./truchetState";
import type { TruchetRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const full: TruchetRequest = { style: "triangles", arrangement: "waves", grid: 16, weight: 6, seed: 7, colors: { background: "#010203", line: "#a0b0c0", accent: "#ffeedd" }, repeatWidth: 7.5 };

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    const base = defaultTruchetState(locale);
    expect(serializeTruchetState(base)).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseTruchetState(new URLSearchParams(serializeTruchetState(state)), locale)).toEqual(state);
  });

  it("offers only even grids, so alternating layouts wrap cleanly", () => {
    for (const grid of GRID_OPTIONS) expect(grid % 2).toBe(0);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultTruchetState();
    const bad = "style=hexagons&a=spiral&g=7&w=999&seed=-3&bg=red&ln=12345&ac=gggggg&r=100";
    expect(parseTruchetState(new URLSearchParams(bad))).toEqual(base);
    expect(parseTruchetState(new URLSearchParams("g=abc&seed=1.5&style=arcs%00"))).toEqual(base);
    expect(parseTruchetState(new URLSearchParams("g=12&w=999")).grid).toBe(12);
    expect(parseTruchetState(new URLSearchParams("g=12&w=999")).weight).toBe(base.weight);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => JSON.stringify(defaultTruchetState(l).colors))).size).toBe(5);
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it.each([["site", uiCopy]] as const)("%s text has the same keys and placeholders in every language", (_, copy) => {
    const english = Object.fromEntries(leaves(copy.en));
    for (const locale of LOCALES) {
      const here = Object.fromEntries(leaves(copy[locale]));
      expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(here)) {
        expect(text.trim()).not.toBe("");
        expect(holes(text)).toEqual(holes(english[key]));
      }
    }
  });
});
