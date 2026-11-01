import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCelticKnotState, serializeCelticKnotState } from "./celticKnotState";
import { parseCrossStitchState, serializeCrossStitchState } from "./crossStitchState";
import { parseGirihState, serializeGirihState } from "./girihState";
import { parseNeedlepointState, serializeNeedlepointState } from "./needlepointState";
import { parseMandalaState, serializeMandalaState } from "./mandalaState";
import { parseSashikoState, serializeSashikoState } from "./sashikoState";
import { parseStainedGlassState, serializeStainedGlassState } from "./stainedGlassState";
import { parseTessellationState, serializeTessellationState } from "./tessellationState";
import { messages } from "./i18n";
import { TARTAN_PRESETS } from "./tartanState";
import { optionHref, optionLabel, optionPath, readSeed, thumbSrc, TOOL_OPTIONS, withOption, type ToolId } from "./toolOptions";
import { parseMazeState, serializeMazeState } from "./mazeState";
import { parseKnitColorworkState, serializeKnitColorworkState } from "./knitColorworkState";
import { parseCrochetColorworkState, serializeCrochetColorworkState } from "./crochetColorworkState";
import { parseCheckerboardState, serializeCheckerboardState } from "./checkerboardState";
import { parseLifeState, serializeLifeState } from "./lifeState";
import { parseFractalState, serializeFractalState } from "./fractalState";
import { parseTieDyeState, serializeTieDyeState } from "./tieDyeState";
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
  needlepoint: (p) => serializeNeedlepointState(parseNeedlepointState(p)),
  knitColorwork: (p) => serializeKnitColorworkState(parseKnitColorworkState(p)),
  crochetColorwork: (p) => serializeCrochetColorworkState(parseCrochetColorworkState(p)),
  checkerboard: (p) => serializeCheckerboardState(parseCheckerboardState(p)),
  life: (p) => serializeLifeState(parseLifeState(p)),
  fractal: (p) => serializeFractalState(parseFractalState(p)),
  tieDye: (p) => serializeTieDyeState(parseTieDyeState(p)),
  maze: (p) => serializeMazeState(parseMazeState(p)),
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
  it("uses the API for maze thumbnails", () => {
    expect(thumbSrc("maze", "square")).toMatch(/\/api\/v1\.0\.1\/maze\/thumbnail\/square$/);
  });

});

describe("remembered seeds", () => {
  it.each([["42", 42], ["0", 0], ["999999", 999999]])("reads %s", (raw, seed) => {
    expect(readSeed(raw)).toBe(seed);
  });

  it.each([null, "", "-1", "1234567", "abc", "1.5"])("ignores %s", (raw) => {
    expect(readSeed(raw)).toBeNull();
  });
});

describe("API thumbnails", () => {
  it("name the API's version in the path", () => {
    expect(thumbSrc("maze", "square")).toMatch(/\/api\/v1\.0\.1\/maze\/thumbnail\/square$/);
    expect(thumbSrc("fractal", "hilbert-curve")).toMatch(/\/api\/v1\.0\.1\/fractal\/thumbnail\/hilbert-curve$/);
  });
});

describe("the library's fill", () => {
  it.each(["truchet", "stainedGlass", "girih", "tieDye"] as const)("%s offers at least six choices, each with a page and an API thumbnail", (tool) => {
    expect(TOOL_OPTIONS[tool].options.length).toBeGreaterThanOrEqual(6);
    for (const { slug } of TOOL_OPTIONS[tool].options) {
      expect(optionPath(tool, slug)).toContain(`/${slug}/`);
      expect(thumbSrc(tool, slug)).toContain(`/thumbnail/${tool}/${slug}`);
    }
  });

  it("offers at least six tartan presets, each named in every language", () => {
    expect(TARTAN_PRESETS.length).toBeGreaterThanOrEqual(6);
    for (const locale of LOCALES) {
      const names = TARTAN_PRESETS.map((preset) => messages(locale).tartan.presets[preset.id]);
      expect(names.every(Boolean)).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
