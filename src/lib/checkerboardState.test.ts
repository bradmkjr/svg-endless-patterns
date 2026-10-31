import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/checkerboard.json";
import { COUNT_OPTIONS, defaultCheckerboardState, parseCheckerboardState, PATTERN_OPTIONS, RATIO_OPTIONS, RATIO_PRESETS, serializeCheckerboardState, UNIT_OPTIONS } from "./checkerboardState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseCheckerboardState(new URLSearchParams(query), locale);

describe("share links", () => {
  it.each(LOCALES)("has an empty link for a standard board in %s", (locale) => {
    expect(serializeCheckerboardState(defaultCheckerboardState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultCheckerboardState(locale));
  });

  it("defaults to a standard 8 by 8 board of squares", () => {
    expect(defaultCheckerboardState()).toMatchObject({ pattern: "checker", cols: 8, rows: 8, ratioWidth: 1, ratioHeight: 1 });
  });

  it("round trips every setting", () => {
    const state = { ...defaultCheckerboardState(), pattern: "brick" as const, cols: 12, rows: 30, ratioWidth: 3, ratioHeight: 1, unit: 0.5, colors: ["#123456", "#abcdef", "#fedcba"] };
    expect(parse(serializeCheckerboardState(state))).toEqual(state);
  });

  it.each(["3-1", "2-3", "1-2"])("keeps the ratio %s", (ratio) => {
    expect(serializeCheckerboardState(parse(`ratio=${ratio}`))).toBe(`ratio=${ratio}`);
  });

  it.each(["p=plaid", "c=7", "r=999", "ratio=9-1", "ratio=0-1", "ratio=3", "ratio=a-b", "u=7", "k=zzzzzz-111111", "k=111111", "k=111111-222222-333333-444444-555555"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultCheckerboardState());
  });

  it("is the same in every language", () => {
    for (const locale of LOCALES) expect(defaultCheckerboardState(locale).colors).toEqual(defaultCheckerboardState().colors);
  });

  it("offers presets it can link to", () => {
    for (const [w, h] of RATIO_PRESETS) expect(RATIO_OPTIONS.includes(w) && RATIO_OPTIONS.includes(h)).toBe(true);
    expect(COUNT_OPTIONS.at(-1)).toBe(100);
    expect(UNIT_OPTIONS).toContain(1);
    expect(PATTERN_OPTIONS[0]).toBe("checker");
  });
});

describe("translation", () => {
  const shape = (value: unknown): unknown => (typeof value === "object" && value ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : [...String(value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());

  it.each(LOCALES)("has the same keys and placeholders in %s", (locale) => {
    expect(shape(uiText[locale])).toEqual(shape(uiText.en));
  });
});
