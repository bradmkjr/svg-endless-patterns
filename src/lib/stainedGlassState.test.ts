import { describe, expect, it } from "vitest";
import { defaultStainedGlassState, parseStainedGlassState, serializeStainedGlassState } from "./stainedGlassState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("round trips %s, dropping defaults", (locale) => {
    const base = defaultStainedGlassState(locale);
    expect(serializeStainedGlassState(base)).toBe("");
    const state = { ...base, layout: "sunburst" as const, width: 24, height: 12, detail: 3, cameWidth: 0.375, heartWidth: 0.046875, colors: ["#010203", "#040506", "#070809", "#0a0b0c"] };
    expect(parseStainedGlassState(params(serializeStainedGlassState(state)), locale)).toEqual(state);
  });

  it("falls back on bad input", () => {
    const base = defaultStainedGlassState();
    expect(parseStainedGlassState(params("l=castle&w=7&h=abc&d=9&came=2&heart=1&c=zz-00"))).toEqual(base);
    expect(parseStainedGlassState(params("c=111111-222222-333333"))).toEqual(base);
    expect(parseStainedGlassState(params("c=<script>-222222-333333-444444"))).toEqual(base);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => defaultStainedGlassState(l).colors.join())).size).toBe(5);
  });

});
