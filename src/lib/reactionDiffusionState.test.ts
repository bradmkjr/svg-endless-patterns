import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/reactionDiffusion.json";
import { defaultRdState, DIRECTION_OPTIONS, parseRdState, PRESET_OPTIONS, serializeRdState, STYLE_OPTIONS } from "./reactionDiffusionState";
import { OPENING_OPTION, TOOL_OPTIONS } from "./toolOptions";
import type { RdRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const full: RdRequest = { preset: "worms", seed: 7, scale: 160, iterations: 1000, threshold: 30, direction: "rising", style: "bands", weight: 4, colors: { background: "#010203", primary: "#a0b0c0", accent: "#ffeedd" }, repeatWidth: 7.5 };

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    expect(serializeRdState(defaultRdState(locale))).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseRdState(new URLSearchParams(serializeRdState(state)), locale)).toEqual(state);
  });

  it("keeps the seed out of the link, but reads one", () => {
    expect(serializeRdState({ ...defaultRdState(), seed: 42 })).toBe("");
    expect(parseRdState(new URLSearchParams("seed=42")).seed).toBe(42);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultRdState();
    expect(parseRdState(new URLSearchParams("p=glider&s=1000&it=99999&t=55&d=up&st=dots&w=9&seed=-3&bg=red&fg=12345&ac=gggggg&r=100"))).toEqual(base);
    expect(parseRdState(new URLSearchParams("s=64&t=999")).scale).toBe(64);
    expect(parseRdState(new URLSearchParams("s=64&t=999")).threshold).toBe(base.threshold);
  });

  it("opens on the default preset, so its option page has the plain link", () => {
    expect(OPENING_OPTION.reactionDiffusion).toBe(defaultRdState().preset);
    expect(TOOL_OPTIONS.reactionDiffusion.options.map((o) => o.slug)).toEqual(PRESET_OPTIONS);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => JSON.stringify(defaultRdState(l).colors))).size).toBe(7);
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it("names every preset, direction and style", () => {
    for (const locale of LOCALES) {
      for (const id of PRESET_OPTIONS) expect(uiCopy[locale].presets[id]).toBeTruthy();
      for (const id of DIRECTION_OPTIONS) expect(uiCopy[locale].directions[id]).toBeTruthy();
      for (const id of STYLE_OPTIONS) expect(uiCopy[locale].styles[id]).toBeTruthy();
    }
  });

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
});
