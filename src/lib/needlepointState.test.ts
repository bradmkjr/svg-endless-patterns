import { describe, expect, it } from "vitest";
import { MOTIFS as CROSS_MOTIFS } from "./crossStitchState";
import {   defaultNeedlepointState,   DEFAULT_MESH,   legacyNeedlepointQuery,   MARGIN_OPTIONS,     MAX_GRID,   MESH_OPTIONS,     MOTIFS,   parseNeedlepointState,   resizeGrid,   serializeNeedlepointState,   setCell,     } from "./needlepointState";
import type { NeedlepointRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

const params = (query: string) => new URLSearchParams(query);

describe("canvas size", () => {
  it("never offers a margin too small to block", () => {
    expect(Math.min(...MARGIN_OPTIONS)).toBeGreaterThanOrEqual(2);
  });
});

describe("designs", () => {
  it("offers at least six", () => {
    expect(MOTIFS.length).toBeGreaterThanOrEqual(6);
  });

  it("are not the same grids as the cross-stitch ones", () => {
    for (const design of MOTIFS) expect(CROSS_MOTIFS.some((m) => m.grid.join() === design.grid.join())).toBe(false);
  });

});

describe("share links", () => {
  it("are empty for the default, in every language", () => {
    for (const locale of LOCALES) expect(serializeNeedlepointState(defaultNeedlepointState(locale))).toBe("");
  });

  it("change one swatch of the opening design with the language", () => {
    const colors = LOCALES.map((locale) => defaultNeedlepointState(locale).colors);
    expect(new Set(colors.map((c) => c.join())).size).toBe(LOCALES.length);
    for (const c of colors.slice(1)) expect(c.filter((color, i) => color !== colors[0][i])).toHaveLength(1);
  });

  it.each(LOCALES)("round trip every setting in %s", (locale) => {
    const base = defaultNeedlepointState(locale);
    const states: NeedlepointRequest[] = [
      { ...base, mesh: 18, stitch: "continental", yarn: "persian", margin: 4, canvas: "#222222", finish: "frame" },
      { ...base, stitch: "tent" },
      { ...base, colors: ["#101010", "#202020", "#303030", "#404040", "#505050", "#606060"] },
      { ...base, grid: MOTIFS[3].grid, colors: MOTIFS[3].colors },
      { ...base, grid: setCell(base.grid, 0, 0, "c") },
      { ...base, grid: resizeGrid(base.grid, MAX_GRID, MAX_GRID) },
      { ...base, grid: resizeGrid([], 8, 8), colors: ["#101010"] },
    ];
    for (const state of states) expect(parseNeedlepointState(params(serializeNeedlepointState(state)), locale)).toEqual(state);
  });

  it.each(["m=trellis", "m=seasideSun&mesh=18", "m=flameSquare&stitch=tent&yarn=persian", "finish=frame", "margin=4"])("keep the deep link %s", (query) => {
    expect(serializeNeedlepointState(parseNeedlepointState(params(query)))).toBe(query);
  });

  it.each(["mesh=11", "mesh=abc", "stitch=cross", "yarn=cotton", "margin=1", "margin=99", "f=zzz", "m=nope", "m=heart", "c=notcolor", "c=", "g=xyz", "g=99999999a", "g=8a-8a", "finish=shelf"])("fall back to the default on the bad value %s", (query) => {
    expect(parseNeedlepointState(params(query))).toEqual(defaultNeedlepointState());
  });

  it("keep the good settings when another is bad", () => {
    expect(parseNeedlepointState(params("mesh=18&stitch=cross"))).toEqual({ ...defaultNeedlepointState(), mesh: 18 });
  });

  it("use defaults that are real options", () => {
    expect(MESH_OPTIONS).toContain(DEFAULT_MESH);
  });
});

describe("old needlepoint links on the cross-stitch page", () => {
  const sailboat = CROSS_MOTIFS.find((m) => m.id === "sailboat")!;
  const open = (query: string, locale: (typeof LOCALES)[number] = "en") => {
    const mapped = legacyNeedlepointQuery(params(query), locale);
    return mapped === null ? null : parseNeedlepointState(params(mapped), locale);
  };

  it("leave every other link alone", () => {
    for (const query of ["", "m=heart", "craft=cross", "craft=knit", "count=18"]) expect(legacyNeedlepointQuery(params(query))).toBeNull();
  });

  it("carry a motif across as its grid and colors", () => {
    expect(open("m=sailboat&craft=needlepoint")).toMatchObject({ grid: sailboat.grid, colors: sailboat.colors });
  });

  it("carry the count across as the mesh, and keep the margin and canvas color", () => {
    expect(open("m=heart&craft=needlepoint&count=18&margin=4&f=222222")).toMatchObject({ mesh: 18, margin: 4, canvas: "#222222" });
    expect(open("m=heart&craft=needlepoint&count=10")).toMatchObject({ mesh: 10 });
  });

  it("drop what doesn't apply to canvas, falling back to a default", () => {
    expect(open("craft=needlepoint&count=11&margin=1&strands=3")).toMatchObject({ mesh: DEFAULT_MESH, margin: 3 });
    expect(open("craft=needlepoint&m=nope&count=abc")!.grid).toEqual(CROSS_MOTIFS[0].grid);
  });

  it("keep a hand-drawn grid and its colors", () => {
    expect(open("craft=needlepoint&g=8a-8b-8.-8.-8.-8.-8.-8.&c=101010-202020")).toMatchObject({ grid: ["aaaaaaaa", "bbbbbbbb", "........", "........", "........", "........", "........", "........"], colors: ["#101010", "#202020"] });
  });

});
