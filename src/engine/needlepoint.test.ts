import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import siteText from "../i18n/messages/needlepoint.json";
import { MOTIFS as CROSS_MOTIFS } from "../lib/crossStitchState";
import {
  defaultNeedlepointState,
  DEFAULT_MESH,
  legacyNeedlepointQuery,
  MARGIN_OPTIONS,
  MAX_COLORS,
  MAX_GRID,
  MESH_OPTIONS,
  MIN_GRID,
  MOTIFS,
  parseNeedlepointState,
  resizeGrid,
  serializeNeedlepointState,
  setCell,
  STITCH_OPTIONS,
  YARN_OPTIONS,
} from "../lib/needlepointState";
import { countStitches, cropGrid } from "./countedChart";
import { generateNeedlepoint, YARDS_PER_SKEIN, yarnStrands, yarnYards, type NeedlepointRequest } from "./needlepoint";
import { generateNeedlepointPdf } from "./needlepointPdf";
import engineText from "./messages/needlepoint.json";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const params = (query: string) => new URLSearchParams(query);
const req: NeedlepointRequest = { grid: ["aab.....", "abb.....", "........", "........", "........", "........", "........", "........"], colors: ["#111111", "#222222"], canvas: "#ffffff", mesh: 10, stitch: "continental", yarn: "tapestry", margin: 2, finish: "frame" };

describe("canvas size", () => {
  it("is the stitched area over the mesh, plus the margin on both sides", () => {
    const result = generateNeedlepoint({ ...req, grid: MOTIFS[0].grid, colors: MOTIFS[0].colors, mesh: 13, margin: 3 });
    expect(result.width).toBe("3");
    expect(result.canvasWidth).toBe("9");
    expect(result.canvasHeight).toBe("9");
    expect(generateNeedlepoint({ ...req, grid: MOTIFS[0].grid, colors: MOTIFS[0].colors, mesh: 10, margin: 2 }).canvasWidth).toBe("8");
  });

  it("names the margin as being for blocking and finishing", () => {
    expect(generateNeedlepoint(req).steps[0]).toContain('2" blocking and finishing margin');
  });

  it("never offers a margin too small to block", () => {
    expect(Math.min(...MARGIN_OPTIONS)).toBeGreaterThanOrEqual(2);
  });
});

describe("yarn", () => {
  const at = (patch: Partial<NeedlepointRequest>) => yarnYards(1000, { ...req, ...patch });

  it("differs by how the stitch travels on the back, half cross least and continental most", () => {
    expect(at({ stitch: "tent" })).toBeLessThan(at({ stitch: "basketweave" }));
    expect(at({ stitch: "basketweave" })).toBeLessThan(at({ stitch: "continental" }));
  });

  it("follows the path of a continental stitch, with the allowance", () => {
    const expected = (1000 * ((Math.SQRT2 + Math.sqrt(5)) / 13) * 1.35) / 36;
    const yards = yarnYards(1000, { mesh: 13, stitch: "continental", yarn: "tapestry" });
    expect(yards).toBeGreaterThanOrEqual(expected);
    expect(yards).toBeLessThan(expected + 0.1);
  });

  it("uses less on a finer mesh", () => {
    expect(at({ mesh: 18 })).toBeLessThan(at({ mesh: 10 }));
  });

  it("counts Persian yarn as three-strand lengths, for the strands that cover the mesh", () => {
    expect(yarnStrands({ mesh: 10, yarn: "persian" })).toBe(3);
    expect(yarnStrands({ mesh: 13, yarn: "persian" })).toBe(2);
    expect(yarnStrands({ mesh: 18, yarn: "persian" })).toBe(1);
    expect(yarnStrands({ mesh: 18, yarn: "tapestry" })).toBe(1);
    // All three strands on 10 mesh is the same length as tapestry wool.
    expect(at({ mesh: 10, yarn: "persian" })).toBe(at({ mesh: 10, yarn: "tapestry" }));
    expect(at({ mesh: 18, yarn: "persian" })).toBeLessThan(at({ mesh: 18, yarn: "tapestry" }));
  });

  it("needs nothing for no stitches", () => {
    expect(yarnYards(0, req)).toBe(0);
  });

  it.each(MOTIFS.map((m) => [m.id, m] as const))("is positive for every color of %s, for every stitch and yarn", (_, design) => {
    for (const stitch of STITCH_OPTIONS) {
      for (const yarn of YARN_OPTIONS) {
        for (const c of generateNeedlepoint({ ...req, grid: design.grid, colors: design.colors, stitch, yarn }).colors) {
          expect(c.yards).toBeGreaterThan(0);
          expect(c.skeins).toBeGreaterThanOrEqual(1);
          expect(c.skeins * YARDS_PER_SKEIN).toBeGreaterThanOrEqual(c.yards);
        }
      }
    }
  });

  it("warns about tapestry wool only on a canvas too fine for it", () => {
    expect(generateNeedlepoint({ ...req, mesh: 18 }).steps.join(" ")).toContain("Persian yarn, one strand");
    expect(generateNeedlepoint({ ...req, mesh: 14 }).steps.join(" ")).not.toContain("Persian yarn, one strand");
    expect(generateNeedlepoint({ ...req, mesh: 18, yarn: "persian" }).steps.join(" ")).not.toContain("is thick");
  });
});

describe("designs", () => {
  it("offers at least six", () => {
    expect(MOTIFS.length).toBeGreaterThanOrEqual(6);
  });

  it("are not the same grids as the cross-stitch ones", () => {
    for (const design of MOTIFS) expect(CROSS_MOTIFS.some((m) => m.grid.join() === design.grid.join())).toBe(false);
  });

  it.each(MOTIFS.map((m) => [m.id, m] as const))("%s is square, in range, covers its canvas, uses all its colors, and has a name", (id, design) => {
    const width = design.grid[0].length;
    expect(design.grid.every((row) => row.length === width), "rows differ").toBe(true);
    expect(design.grid.length).toBe(width);
    expect(width).toBeGreaterThanOrEqual(MIN_GRID);
    expect(width).toBeLessThanOrEqual(MAX_GRID);
    expect(design.colors.length).toBeLessThanOrEqual(MAX_COLORS);
    expect(design.grid.join("")).not.toContain(".");
    expect(cropGrid(design.grid)).toEqual(design.grid);
    expect(countStitches(design.grid, design.colors.length).every((n) => n > 0)).toBe(true);
    for (const locale of LOCALES) expect(siteText[locale].motifs[id]).toBeTruthy();
  });

  it.each(MOTIFS.map((m) => [m.id, m] as const))("%s counts sum to every stitch, and leave its largest color for last", (_, design) => {
    const result = generateNeedlepoint({ ...req, grid: design.grid, colors: design.colors });
    expect(result.colors.reduce((sum, c) => sum + c.stitches, 0)).toBe(result.stitches);
    expect(result.stitches).toBe(design.grid.length ** 2);
    expect(result.bareStitches).toBe(0);
    expect(result.turns.reduce((sum, turn) => sum + turn.stitches, 0)).toBe(result.stitches);
    expect(result.turns.at(-1)!.stitches).toBe(Math.max(...result.colors.map((c) => c.stitches)));
  });

  it("names no yarn maker", () => {
    expect(JSON.stringify([engineText, siteText])).not.toMatch(/\b(DMC|Anchor|Madeira|Appleton|Paternayan)\b/i);
  });
});

describe("instructions", () => {
  it("describe the stitch chosen, each its own way", () => {
    const text = (stitch: NeedlepointRequest["stitch"]) => generateNeedlepoint({ ...req, stitch }).steps.join(" ");
    expect(text("basketweave")).toContain("diagonal rows");
    expect(text("continental")).toContain("Turn the canvas");
    expect(text("tent")).toContain("interlock canvas");
  });

  it("flag bare canvas inside the design, and only then", () => {
    const holed = generateNeedlepoint(req);
    expect(holed.bareStitches).toBe(0);
    const bare = generateNeedlepoint({ ...req, grid: ["a.a", "...", "a.a", ...Array<string>(5).fill("...")] });
    expect(bare.bareStitches).toBe(5);
    expect(bare.steps.join(" ")).toContain("5 squares bare");
    expect(holed.steps.join(" ")).not.toContain("squares bare");
  });

  it("block before making up, for a frame or a pillow", () => {
    const design = { ...req, grid: MOTIFS[0].grid, colors: MOTIFS[0].colors, mesh: 13, margin: 3 };
    const framed = generateNeedlepoint({ ...design, finish: "frame" });
    expect(framed.finishing[0]).toContain("Block");
    expect(framed.finishing.join(" ")).toContain('3" x 3"');
    const pillow = generateNeedlepoint({ ...design, finish: "pillow" });
    expect(pillow.finishing[0]).toContain("Block");
    // 3" stitched, plus a 1/2" seam a side, plus strips that finish 2" wide.
    const text = pillow.finishing.join(" ");
    expect(text).toContain('4" x 4"');
    expect(text).toContain('8" x 8"');
    expect(text).toContain('7" x 7"');
  });

  it("change the words, not the numbers, between languages", () => {
    const en = generateNeedlepoint(req);
    for (const locale of LOCALES.slice(1)) {
      const translated = generateNeedlepoint({ ...req, locale });
      expect(translated.colors).toEqual(en.colors);
      expect(translated.turns).toEqual(en.turns);
      expect([translated.width, translated.canvasWidth]).toEqual([en.width, en.canvasWidth]);
      expect(translated.steps).not.toEqual(en.steps);
    }
  });
});

describe("output", () => {
  it("sizes the stitched SVG at true scale, with one slant a stitch", () => {
    const { stitched } = generateNeedlepoint(req).svg;
    expect(stitched).toContain('viewBox="0 0 3 2"');
    expect(stitched).toContain('width="0.3in"');
    expect(stitched.match(/l1 -1/g)).toHaveLength(6);
  });

  it("gives an empty grid no size, and still draws a chart", () => {
    const result = generateNeedlepoint({ ...req, grid: resizeGrid([], 8, 8) });
    expect([result.columns, result.rows, result.stitches, result.totalYards]).toEqual([0, 0, 0, 0]);
    expect(result.svg.chart).toContain("<svg");
  });

  it.each(LOCALES)("builds a %s PDF, split over sheets, with no text left unfilled", async (locale) => {
    const base = defaultNeedlepointState(locale);
    for (const state of [base, { ...base, stitch: "tent" as const, yarn: "persian" as const, mesh: 18, finish: "frame" as const }, { ...base, stitch: "continental" as const, mesh: 18 }, { ...base, grid: resizeGrid([], 8, 8) }]) {
      const doc = await PDFDocument.load(await generateNeedlepointPdf(state));
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
      const result = generateNeedlepoint(state);
      expect(JSON.stringify([result.steps, result.materials, result.order, result.finishing])).not.toMatch(/\{\w+\}/);
    }
    expect((await PDFDocument.load(await generateNeedlepointPdf(base))).getPageCount()).toBeGreaterThan(generateNeedlepoint(base).sheets);
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

  it.each(LOCALES)("work in %s, opening something the generator can draw", (locale) => {
    const state = open("m=cottage&craft=needlepoint", locale)!;
    expect(() => generateNeedlepoint(state)).not.toThrow();
    expect(state.locale).toBe(locale === "en" ? undefined : locale);
  });
});

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  return Object.entries(value as object).flatMap(([key, child]) => leaves(child, `${path}.${key}`));
}

describe.each([
  ["engine", engineText],
  ["site", siteText],
] as const)("%s text", (name, catalog) => {
  const english = new Map(leaves(catalog.en));

  it.each(LOCALES)("%s has the same keys and placeholders as English, none empty", (locale) => {
    const translated = new Map(leaves(catalog[locale]));
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of translated) {
      expect(text, key).not.toBe("");
      expect(placeholders(text), key).toEqual(placeholders(english.get(key)!));
    }
  });

  it.each(LOCALES)("%s fits Helvetica's character set where it reaches a PDF", (locale) => {
    if (name !== "engine") return;
    for (const [key, text] of leaves(catalog[locale])) expect(text, key).toMatch(/^[\x20-\x7e -ÿ]*$/);
  });

  it.each(LOCALES.slice(1))("%s isn't still English", (locale) => {
    const translated = leaves(catalog[locale]);
    const same = translated.filter(([key, text]) => text === english.get(key));
    expect(same.length / translated.length).toBeLessThan(0.1);
  });
});
