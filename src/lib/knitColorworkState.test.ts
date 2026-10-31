import { describe, expect, it } from "vitest";
import site from "@/i18n/messages/knitColorwork.json";
import { KNIT_COLORWORK_OPTIONS as DESIGNS } from "./knitColorworkOptions";
import { defaultKnitColorworkState, parseKnitColorworkState, serializeKnitColorworkState } from "./knitColorworkState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  it("round-trips every setting", () => {
    const query = "d=ribbon-chevron&sq=10&sg=26&rg=30&c=112233&cc=445566-778899";
    const state = parseKnitColorworkState(new URLSearchParams(query));
    expect(state.contrast).toEqual(["#445566", "#778899"]);
    expect(serializeKnitColorworkState(state)).toBe(query);
  });

  it.each(LOCALES)("leaves defaults out in %s", (locale) => {
    expect(serializeKnitColorworkState(defaultKnitColorworkState(locale))).toBe("");
    for (const design of DESIGNS) expect(serializeKnitColorworkState(parseKnitColorworkState(new URLSearchParams(`d=${design.id}`), locale))).toBe(design === DESIGNS[0] ? "" : `d=${design.id}`);
  });

  it("falls back on invalid values", () => {
    const state = parseKnitColorworkState(new URLSearchParams("d=nope&sq=7&sg=999&rg=x&c=zzz&cc=12"));
    expect(state).toEqual(defaultKnitColorworkState());
  });

  it("falls back on the wrong number of contrasts", () => {
    const base = parseKnitColorworkState(new URLSearchParams("d=ribbon-chevron"));
    expect(parseKnitColorworkState(new URLSearchParams("d=ribbon-chevron&cc=112233")).contrast).toEqual(base.contrast);
    expect(parseKnitColorworkState(new URLSearchParams("d=ribbon-chevron&cc=112233-445566-778899")).contrast).toEqual(base.contrast);
  });

  it("never carries a seed", () => {
    expect(serializeKnitColorworkState(parseKnitColorworkState(new URLSearchParams("seed=5&d=little-bands")))).toBe("d=little-bands");
  });
});

describe("languages", () => {
  it("changes one secondary color only", () => {
    const three = (locale: (typeof LOCALES)[number]) => parseKnitColorworkState(new URLSearchParams("d=ribbon-chevron"), locale);
    for (const locale of LOCALES) {
      expect(three(locale).color).toBe(three("en").color);
      expect(three(locale).contrast![0]).toBe(three("en").contrast![0]);
    }
    expect(three("es").contrast![1]).not.toBe(three("en").contrast![1]);
  });

  const shape = (value: unknown): unknown => (typeof value === "object" && value ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());

  it.each(LOCALES)("has the same keys and placeholders in %s", (locale) => {
    expect(shape(site[locale])).toEqual(shape(site.en));
  });
});
