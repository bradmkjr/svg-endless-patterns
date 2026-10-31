import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCelticKnotState, serializeCelticKnotState } from "./celticKnotState";
import { parseCrossStitchState, serializeCrossStitchState } from "./crossStitchState";
import { parseGirihState, serializeGirihState } from "./girihState";
import { parseMandalaState, serializeMandalaState } from "./mandalaState";
import { parseSashikoState, serializeSashikoState } from "./sashikoState";
import { parseStainedGlassState, serializeStainedGlassState } from "./stainedGlassState";
import { parseTessellationState, serializeTessellationState } from "./tessellationState";
import { allThumbs } from "./thumbnails";
import { optionHref, optionLabel, readSeed, TOOL_OPTIONS, withOption, type ToolId } from "./toolOptions";
import { parseTruchetState, serializeTruchetState } from "./truchetState";

const TOOLS = Object.keys(TOOL_OPTIONS) as ToolId[];
const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const ROUND_TRIP: Record<ToolId, (params: URLSearchParams) => string> = {
  truchet: (p) => serializeTruchetState(parseTruchetState(p)),
  tessellation: (p) => serializeTessellationState(parseTessellationState(p)),
  girih: (p) => serializeGirihState(parseGirihState(p)),
  sashiko: (p) => serializeSashikoState(parseSashikoState(p)),
  celticKnot: (p) => serializeCelticKnotState(parseCelticKnotState(p)),
  stainedGlass: (p) => serializeStainedGlassState(parseStainedGlassState(p)),
  crossStitch: (p) => serializeCrossStitchState(parseCrossStitchState(p)),
  mandala: (p) => serializeMandalaState(parseMandalaState(p)),
};

describe.each(TOOLS)("%s option pages", (tool) => {
  it("has routes in both trees", () => {
    const folder = TOOL_OPTIONS[tool].path.slice(1);
    expect(existsSync(`src/app/(en)/${folder}[option]/page.tsx`)).toBe(true);
    expect(existsSync(`src/app/[locale]/${folder}[option]/page.tsx`)).toBe(true);
  });

  it("opens each choice from its path, whatever the query says", () => {
    const { param, options } = TOOL_OPTIONS[tool];
    for (const { slug, value } of options) {
      const other = options.find((o) => o.value !== value)!.value;
      const query = ROUND_TRIP[tool](withOption(tool, slug, `${param}=${other}`));
      const expected = new URLSearchParams(query).get(param);
      // A default value is left out of the link, and only the default.
      if (expected !== null) expect(expected).toBe(value);
      else expect(ROUND_TRIP[tool](new URLSearchParams(`${param}=${other}`))).toContain(`${param}=${other}`);
    }
  });

  it("carries other settings over to a choice's link, but not the choice", () => {
    const { param, options } = TOOL_OPTIONS[tool];
    const href = optionHref(tool, "fr", options[0].slug, `?${param}=x&keep=1`);
    expect(href).toBe(`/fr${TOOL_OPTIONS[tool].path}${options[0].slug}/?keep=1`);
  });

  it.each(LOCALES)("names every choice in %s", (locale) => {
    const groups = TOOL_OPTIONS.tessellation.options.map((o) => ({ id: o.value, description: "x", family: "" })) as never;
    for (const { slug } of TOOL_OPTIONS[tool].options) expect(optionLabel(tool, slug, locale, { groups })).toBeTruthy();
  });
});

describe("thumbnails", () => {
  it("draws every one as a small, unique, standalone SVG", async () => {
    const thumbs = await allThumbs();
    expect(new Set(thumbs.map((t) => `${t.group}/${t.slug}`)).size).toBe(thumbs.length);
    for (const thumb of thumbs) {
      const svg = await thumb.draw();
      expect(svg.startsWith("<svg"), `${thumb.group}/${thumb.slug}`).toBe(true);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    }
  }, 120000);
});

describe("remembered seeds", () => {
  it.each([["42", 42], ["0", 0], ["999999", 999999]])("reads %s", (raw, seed) => {
    expect(readSeed(raw)).toBe(seed);
  });

  it.each([null, "", "-1", "1234567", "abc", "1.5"])("ignores %s", (raw) => {
    expect(readSeed(raw)).toBeNull();
  });
});
