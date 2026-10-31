import { describe, expect, it } from "vitest";
import uiText from "../i18n/messages/tieDye.json";
import { defaultTieDyeState, parseTieDyeState, serializeTieDyeState } from "./tieDyeState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

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

});

describe("translation", () => {
  const flat = (value: object, prefix = ""): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  describe.each([["site", uiText]] as const)("%s text", (_, catalog) => {
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

});
