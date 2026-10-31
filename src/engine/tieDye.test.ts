import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import uiText from "../i18n/messages/tieDye.json";
import { BAND_OPTIONS, defaultTieDyeState, GARMENT_OPTIONS, parseTieDyeState, serializeTieDyeState, STRENGTH_OPTIONS, TECHNIQUE_OPTIONS } from "../lib/tieDyeState";
import { LOCALES } from "./i18n";
import engineText from "./messages/tieDye.json";
import { generateTieDye, TECHNIQUES, tieDyeLayers, tieDyeMix, type TieDyeRequest } from "./tieDye";
import { generateTieDyePdf } from "./tieDyePdf";

const req: TieDyeRequest = { technique: "spiral", bands: 6, dyes: ["#cc0044", "#0044cc", "#ccaa00", "#118833"], fabric: "#ffffff", seed: 7, garments: 1, strength: 2 };

describe("drawing", () => {
  it.each(TECHNIQUES)("%s draws every dye, repeatably, and differs by seed", (technique) => {
    const state = { ...req, technique };
    expect(generateTieDye(state).svg.art).toBe(generateTieDye({ ...state }).svg.art);
    expect(generateTieDye({ ...state, seed: 8 }).svg.art).not.toBe(generateTieDye(state).svg.art);
    for (const dyes of [1, 2, 3, 4]) expect(tieDyeLayers({ ...state, dyes: state.dyes.slice(0, dyes) }).length).toBeGreaterThanOrEqual(dyes);
    for (const color of state.dyes) expect(generateTieDye(state).svg.guide).toContain(color);
  });

  it.each(TECHNIQUES)("%s stays on the canvas and is a reasonable size", (technique) => {
    for (const bands of [4, 12]) {
      const { art } = generateTieDye({ ...req, technique, bands }).svg;
      expect(art.length).toBeLessThan(800_000);
      expect(art).toContain('style="isolation:isolate"');
      for (const [, x, y] of art.matchAll(/M(-?\d+) (-?\d+)l/g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeLessThanOrEqual(1000);
      }
    }
  });

  it("doesn't change the design for a language or amount change", () => {
    const paths = (r: TieDyeRequest) => generateTieDye(r).svg.art.replace(/<title>.*<\/title>/, "");
    for (const locale of LOCALES) expect(paths({ ...req, locale })).toBe(paths(req));
    expect(paths({ ...req, garments: 5, strength: 8 })).toBe(paths(req));
  });
});

describe("mixing amounts", () => {
  it("matches the source's figures for one dye on one shirt", () => {
    expect(tieDyeMix({ ...req, dyes: ["#000000"] })[0]).toEqual({ letter: "A", color: "#000000", ounces: 4, teaspoons: 1, ureaTablespoons: 0.5 });
    expect(tieDyeMix({ ...req, dyes: ["#000000"], garments: 2, strength: 8 })[0]).toMatchObject({ ounces: 8, teaspoons: 8, ureaTablespoons: 1 });
  });

  it("never mixes too little", () => {
    for (const garments of GARMENT_OPTIONS) for (const count of [1, 2, 3, 4]) for (const strength of STRENGTH_OPTIONS) {
      const mix = tieDyeMix({ ...req, dyes: req.dyes.slice(0, count), garments, strength });
      expect(mix).toHaveLength(count);
      expect(mix.reduce((sum, row) => sum + row.ounces, 0)).toBeGreaterThanOrEqual(garments * 4);
      for (const row of mix) {
        expect(row.teaspoons).toBeGreaterThanOrEqual((row.ounces / 8) * strength);
        expect(row.ureaTablespoons).toBeGreaterThanOrEqual(row.ounces / 8);
      }
    }
  });
});

describe("steps", () => {
  it.each(TECHNIQUES)("%s has counts that match its ties", (technique) => {
    for (const bands of BAND_OPTIONS) {
      const { fold, safety } = generateTieDye({ ...req, technique, bands }).steps;
      expect(fold).toHaveLength(3);
      expect(safety.length).toBeGreaterThan(0);
      if (technique === "spiral") expect(fold[2]).toContain(`${bands / 2} rubber bands`);
      if (technique === "bullseye") expect(fold[2]).toContain(`${bands - 1} rubber bands`);
      for (const line of fold) expect(line).not.toMatch(/\{\w+\}/);
    }
  });
});

describe("share links", () => {
  const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseTieDyeState(new URLSearchParams(query), locale);

  it.each(LOCALES)("has an empty link for the %s defaults", (locale) => {
    expect(serializeTieDyeState(defaultTieDyeState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultTieDyeState(locale));
  });

  it("round trips every setting except the seed, which stays out of links", () => {
    const state = { ...defaultTieDyeState(), technique: "bullseye" as const, bands: 12, dyes: ["#123456", "#abcdef"], fabric: "#eeeeee", garments: 9, strength: 8 };
    expect(parse(serializeTieDyeState(state))).toEqual(state);
    expect(serializeTieDyeState({ ...state, seed: 99 })).not.toContain("99");
  });

  it.each(["t=shibori", "b=5", "k=zzzzzz", "k=111111-222222-333333-444444-555555", "f=red", "g=99", "s=3"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultTieDyeState());
  });

  it("changes only one secondary color by language", () => {
    for (const locale of LOCALES) {
      const { dyes } = defaultTieDyeState(locale);
      expect(dyes[0]).toBe(defaultTieDyeState().dyes[0]);
      expect(dyes[2]).toBe(defaultTieDyeState().dyes[2]);
    }
  });

  it("offers what the engine draws", () => {
    expect(TECHNIQUE_OPTIONS).toEqual([...TECHNIQUES]);
  });
});

describe("translation", () => {
  const flat = (value: object, prefix = ""): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  describe.each([["engine", engineText], ["site", uiText]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
      const english = flat(catalog.en);
      const text = flat(catalog[locale]);
      expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
      for (const [key, value] of Object.entries(english)) {
        expect(text[key], key).toBeTruthy();
        expect(placeholders(text[key]), key).toEqual(placeholders(value));
      }
    });
  });

  it.each(LOCALES)("PDF text in %s fits Helvetica's character set", (locale) => {
    for (const value of Object.values(engineText[locale])) expect(value).toMatch(/^[\x20-\x7e\xa0-ÿ]*$/);
  });
});

describe("PDF", () => {
  it.each(LOCALES)("builds in %s", async (locale) => {
    for (const technique of TECHNIQUES) {
      const doc = await PDFDocument.load(await generateTieDyePdf({ ...defaultTieDyeState(locale), technique }));
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
      expect(doc.getTitle()).toBe(engineText[locale].pdfTitle);
    }
  });
});
