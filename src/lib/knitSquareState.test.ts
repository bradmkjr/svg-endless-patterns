import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/knitSquare.json";
import { DEFAULT_KNIT_SQUARE, KNIT_SQUARE_SIZES } from "./generator";
import { getStitchPattern } from "./patternCatalog";
import { defaultStitchState, parseStitchState, serializeStitchState, YARN_WEIGHTS } from "./stitchState";

const knit = (await getStitchPattern("knit", "seed-stitch"))!;
const crochet = (await getStitchPattern("crochet", "single-crochet"))!;

describe("square size in the share link", () => {
  it("leaves the default out of the link", () => {
    expect(serializeStitchState(knit, defaultStitchState(knit))).toBe("");
    expect(serializeStitchState(knit, { ...defaultStitchState(knit), squareSize: DEFAULT_KNIT_SQUARE })).toBe("");
  });

  it("round-trips every size", () => {
    for (const squareSize of KNIT_SQUARE_SIZES.filter((size) => size !== DEFAULT_KNIT_SQUARE)) {
      const state = { ...defaultStitchState(knit), squareSize };
      expect(parseStitchState(knit, new URLSearchParams(serializeStitchState(knit, state)))).toEqual(state);
    }
    expect(serializeStitchState(knit, { ...defaultStitchState(knit), squareSize: 12 })).toBe("sq=12");
  });

  it("falls back to the default on anything else", () => {
    for (const bad of ["7", "0", "-8", "abc", "", "8.5", "1e3"]) {
      expect(parseStitchState(knit, new URLSearchParams({ sq: bad })), bad).toEqual(defaultStitchState(knit));
    }
  });

  it("doesn't apply to crochet", () => {
    expect(parseStitchState(crochet, new URLSearchParams({ sq: "12" })).squareSize).toBeUndefined();
    expect(serializeStitchState(crochet, defaultStitchState(crochet))).toBe("");
  });
});

describe("the square's builder text", () => {
  it.each(["es", "fr", "de", "pt"] as const)("has every key in %s", (locale) => {
    expect(Object.keys(uiText[locale]).sort()).toEqual(Object.keys(uiText.en).sort());
    for (const [key, value] of Object.entries(uiText[locale])) expect(value, key).toBeTruthy();
  });
});
