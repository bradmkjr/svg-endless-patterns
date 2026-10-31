import { describe, expect, it } from "vitest";
import text from "@/i18n/messages/palettes.json";
import { readPalettes } from "./customPalettes";
import { HARMONIES, harmonyColors, HUES, paletteAccents, THEME_GROUPS } from "./palettes";

const HEX = /^#[0-9a-f]{6}$/;
const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const flat = (value: object, prefix = ""): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));

describe("palette library", () => {
  it("has themed palettes with at least five valid, different colors and a name", () => {
    const palettes = THEME_GROUPS.flatMap((group) => group.palettes);
    expect(palettes.length).toBe(60);
    expect(new Set(palettes.map((p) => p.id)).size).toBe(palettes.length);
    for (const palette of palettes) {
      expect(palette.colors.length, palette.id).toBeGreaterThanOrEqual(5);
      expect(palette.colors.length, palette.id).toBeLessThanOrEqual(8);
      expect(new Set(palette.colors).size, palette.id).toBe(palette.colors.length);
      for (const color of palette.colors) expect(color).toMatch(HEX);
      for (const locale of LOCALES) expect(text[locale].names[palette.id]).toBeTruthy();
    }
  });

  it("builds every harmony at every hue", () => {
    for (const harmony of HARMONIES) {
      for (const hue of HUES) {
        const colors = harmonyColors(harmony, hue.degrees);
        expect(colors).toHaveLength(5);
        expect(new Set(colors).size).toBe(5);
        for (const color of colors) expect(color).toMatch(HEX);
      }
    }
  });

  it("places complements opposite each other", () => {
    expect(harmonyColors("complementary", 0)[2]).toBe("#ba2c2c");
    expect(harmonyColors("complementary", 0)[3]).toBe("#2cbaba");
  });

  it("repeats accents when a tool needs more than a palette has", () => {
    expect(paletteAccents(["#000000", "#111111", "#222222"], 3)).toEqual(["#111111", "#222222", "#111111"]);
  });

  it.each(LOCALES)("has the same text in %s as English", (locale) => {
    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const english = flat(text.en);
    const translated = flat(text[locale]);
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
    for (const [key, value] of Object.entries(english)) {
      expect(translated[key], key).toBeTruthy();
      expect(placeholders(translated[key]), key).toEqual(placeholders(value));
    }
  });
});

describe("saved palettes", () => {
  const good = { id: "1", name: "Mine", colors: ["#112233", "#ABCDEF"] };

  it("reads what was stored, in lower case", () => {
    expect(readPalettes(JSON.stringify([good]))).toEqual([{ ...good, colors: ["#112233", "#abcdef"] }]);
  });

  it.each([null, "", "not json", "{}", "[1]", '[{"id":"1"}]'])("ignores the unusable value %s", (raw) => {
    expect(readPalettes(raw)).toEqual([]);
  });

  it("drops only the palettes that don't read", () => {
    const stored = [good, { ...good, name: " " }, { ...good, colors: ["#112233"] }, { ...good, colors: ["red", "blue"] }, { ...good, colors: Array(9).fill("#112233") }];
    expect(readPalettes(JSON.stringify(stored))).toHaveLength(1);
  });

  it("keeps a stored script from reaching a style as a color", () => {
    expect(readPalettes(JSON.stringify([{ ...good, colors: ["#112233", "url(javascript:x)"] }]))).toEqual([]);
  });
});
