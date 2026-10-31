import { describe, expect, it } from "vitest";
import type { GirihRequest } from "./generator";
import { parseGirihState, serializeGirihState, defaultGirihState } from "./girihState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("%s defaults leave an empty query", (locale) => {
    expect(serializeGirihState(defaultGirihState(locale))).toBe("");
    expect(parseGirihState(params(""), locale)).toEqual(defaultGirihState(locale));
  });

  it("round trips every setting", () => {
    const state: GirihRequest = { symmetry: 12, star: "sharp", lineWeight: 8, colors: { background: "#010203", primary: "#040506", accent: "#070809", line: "#0a0b0c" }, showTiles: true, repeatWidth: 12, across: 5, down: 2 };
    expect(parseGirihState(params(serializeGirihState(state)))).toEqual(state);
  });

  it("falls back on bad input", () => {
    const fallback = defaultGirihState();
    expect(parseGirihState(params("n=7&star=nope&weight=999&c=zzz&w=-1&x=0&y=abc&tiles=2"))).toEqual(fallback);
    expect(parseGirihState(params("n=&weight=&w="))).toEqual(fallback);
    expect(parseGirihState(params("c=112233-445566"))).toEqual(fallback);
  });

});
