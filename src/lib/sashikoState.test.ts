import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/sashiko.json";
import { defaultSashikoState, MOTIF_OPTIONS, parseSashikoState, serializeSashikoState } from "./sashikoState";
import type { SashikoRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;


describe("share links", () => {
  it("leaves defaults out", () => {
    for (const locale of LOCALES) expect(serializeSashikoState(defaultSashikoState(locale))).toBe("");
  });

  it("round-trips every setting", () => {
    const state: SashikoRequest = { motif: "seigaiha", spacing: 3, stitch: 0.1875, width: 18, height: 24, cloth: "#112233", thread: "#abcdef" };
    expect(parseSashikoState(new URLSearchParams(serializeSashikoState(state)))).toEqual(state);
    const pt = { ...state, locale: "pt" as const };
    expect(parseSashikoState(new URLSearchParams(serializeSashikoState(pt)), "pt")).toEqual(pt);
  });

  it("falls back on bad input", () => {
    const params = new URLSearchParams("m=nope&sp=9999&st=abc&w=-3&h=&c=zzz&t=%23000000");
    expect(parseSashikoState(params)).toEqual(defaultSashikoState());
    expect(parseSashikoState(params, "es")).toEqual(defaultSashikoState("es"));
  });

  it("keeps its two primary colors in every language", () => {
    const colors = LOCALES.map((l) => defaultSashikoState(l).cloth);
    expect(new Set(colors).size).toBe(1);
  });

});

describe("translations", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flatten = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => flatten(v, path ? `${path}.${k}` : k));

  describe.each([["site", uiCopy]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has every key with the same placeholders", (locale) => {
      const english = flatten(catalog.en);
      const theirs = new Map(flatten(catalog[locale]));
      expect([...theirs.keys()].sort()).toEqual(english.map(([k]) => k).sort());
      for (const [k, text] of english) {
        expect(theirs.get(k), k).toBeTruthy();
        expect(placeholders(theirs.get(k)!), k).toEqual(placeholders(text));
      }
    });
  });

});

describe("site text", () => {
  it("covers every motif", () => {
    for (const locale of LOCALES) for (const motif of MOTIF_OPTIONS) expect(uiCopy[locale].spacingHelp[motif]).toBeTruthy();
  });
});
