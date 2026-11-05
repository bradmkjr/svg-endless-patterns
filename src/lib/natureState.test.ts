import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/nature.json";
import { defaultNatureState, MOTIF_OPTIONS, parseNatureState, serializeNatureState } from "./natureState";
import type { NatureRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const full: NatureRequest = {
    motif: "clouds",
    layout: "grid",
    packing: "overlapping",
    style: "outline",
    density: 5,
    scale: 150,
    variation: 60,
    rotation: 90,
    seed: 7,
    colors: { background: "#010203", primary: "#a0b0c0", secondary: "#123456", accent: "#ffeedd" },
    repeatWidth: 7.5,
  };

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    for (const motif of MOTIF_OPTIONS) expect(serializeNatureState(defaultNatureState(locale, motif))).toBe(motif === "leaves" ? "" : `m=${motif}`);
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseNatureState(new URLSearchParams(serializeNatureState(state)), locale)).toEqual(state);
  });

  it("opens each motif in its own colors, and keeps colors set by hand", () => {
    expect(parseNatureState(new URLSearchParams("m=clouds")).colors).toEqual(defaultNatureState("en", "clouds").colors);
    const mine = parseNatureState(new URLSearchParams("m=rocks&bg=000000"));
    expect(mine.colors.background).toBe("#000000");
    expect(mine.colors.primary).toBe(defaultNatureState("en", "rocks").colors.primary);
  });

  it("leaves the seed out of links", () => {
    expect(serializeNatureState({ ...defaultNatureState(), seed: 1234 })).toBe("");
    expect(parseNatureState(new URLSearchParams("seed=1234")).seed).toBe(1234);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultNatureState();
    const bad = "m=trees&l=spiral&p=far&st=dotted&d=9&sc=7&v=99&rot=45&seed=-3&bg=red&pr=12345&se=gggggg&ac=&r=100";
    expect(parseNatureState(new URLSearchParams(bad))).toEqual(base);
    expect(parseNatureState(new URLSearchParams("d=4&sc=999")).density).toBe(4);
    expect(parseNatureState(new URLSearchParams("d=4&sc=999")).scale).toBe(base.scale);
  });

  it("varies default colors by language, changing only the accent", () => {
    for (const motif of MOTIF_OPTIONS) {
      const all = LOCALES.map((l) => defaultNatureState(l, motif).colors);
      expect(new Set(all.map((c) => JSON.stringify(c))).size).toBe(7);
      for (const colors of all) expect({ ...colors, accent: "" }).toEqual({ ...all[0], accent: "" });
    }
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
        expect(text.trim()).not.toBe("");
        expect(holes(text)).toEqual(holes(english[key]));
      }
    }
  });

  it("names every motif", () => {
    for (const locale of LOCALES) for (const motif of MOTIF_OPTIONS) expect(uiCopy[locale].motifs[motif]).toBeTruthy();
  });
});
