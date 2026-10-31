import { describe, expect, it } from "vitest";
import uiText from "../i18n/messages/celticKnot.json";
import { defaultCelticKnotState, parseCelticKnotState, serializeCelticKnotState } from "./celticKnotState"; 

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("round trips the %s default as an empty query", (locale) => {
    const state = defaultCelticKnotState(locale);
    expect(serializeCelticKnotState(state)).toBe("");
    expect(parseCelticKnotState(params(""), locale)).toEqual(state);
  });

  it("falls back to defaults on bad input", () => {
    const bad = "c=99&r=-1&p=evil&seed=1e9&d=33&w=abc&i=<x>&in=0&k=zzz-000000&bg=red&ol=%22%3E";
    const parsed = parseCelticKnotState(params(bad));
    expect(parsed).toEqual(defaultCelticKnotState());
    expect(parseCelticKnotState(params("seed=-5")).seed).toBe(defaultCelticKnotState().seed);
    expect(parseCelticKnotState(params("k=000000-000000-000000-000000-000000-000000-000000")).colors).toEqual(defaultCelticKnotState().colors);
  });

});

describe("translation", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  /** Every string in a nested object, by its dotted path. */
  const flat = (value: object, prefix = ""): Record<string, string> =>
    Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));

  describe.each([["site", uiText]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
      const english = flat(catalog.en);
      const text = flat(catalog[locale]);
      expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
      for (const [name, value] of Object.entries(english)) {
        expect(text[name], name).toBeTruthy();
        expect(placeholders(text[name]), name).toEqual(placeholders(value));
      }
    });
  });

});
