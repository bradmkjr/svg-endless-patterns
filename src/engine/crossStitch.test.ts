import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import siteText from "../i18n/messages/crossStitch.json";
import {
  COUNT_OPTIONS,
  defaultCrossStitchState,
  DEFAULT_COUNT,
  MAX_GRID,
  MIN_GRID,
  MOTIFS,
  parseCrossStitchState,
  removeColor,
  resizeGrid,
  serializeCrossStitchState,
  setCell,
} from "../lib/crossStitchState";
import { countStitches, cropGrid, generateCrossStitch, SYMBOLS, threadYards, type CrossStitchRequest } from "./crossStitch";
import { generateCrossStitchPdf } from "./crossStitchPdf";
import engineText from "./messages/crossStitch.json";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

const grid = ["........", "..aab...", "..abb...", "...c....", "........", "........", "........", "........"];
const req: CrossStitchRequest = { grid, colors: ["#111111", "#222222", "#333333"], fabric: "#ffffff", craft: "cross", count: 14, strands: 2, margin: 3 };
const params = (query: string) => new URLSearchParams(query);

describe("finished size", () => {
  it("is the stitched area divided by the fabric count", () => {
    for (const count of COUNT_OPTIONS.cross) {
      const result = generateCrossStitch({ ...req, count });
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(3);
      expect(result.widthInches).toBeCloseTo(3 / count, 10);
      expect(result.heightInches).toBeCloseTo(3 / count, 10);
    }
  });

  it("leaves out bare rows and columns around the design", () => {
    expect(cropGrid(grid)).toEqual(["aab", "abb", ".c."]);
  });

  it("shrinks as the count rises", () => {
    const motif = MOTIFS[0];
    const at = (count: number) => generateCrossStitch({ ...req, grid: motif.grid, colors: motif.colors, count });
    // The rosette is 21 stitches wide: 1 1/2" at 14 count, 21/18" (about 1 1/8") at 18.
    expect(at(14).width).toBe("1 1/2");
    expect(at(18).width).toBe("~1 1/8");
  });

  it("adds the margin on both sides for the fabric to cut, rounded up to a ruler mark", () => {
    const result = generateCrossStitch({ ...req, grid: MOTIFS[0].grid, colors: MOTIFS[0].colors, count: 14, margin: 2 });
    expect(result.fabricWidth).toBe("5 1/2");
    // 21/18 + 4 = 5.1667, up to 5 1/4.
    expect(generateCrossStitch({ ...req, grid: MOTIFS[0].grid, colors: MOTIFS[0].colors, count: 18, margin: 2 }).fabricWidth).toBe("5 1/4");
  });

  it("gives an empty grid no size, and still draws a chart", () => {
    const result = generateCrossStitch({ ...req, grid: resizeGrid([], 8, 8) });
    expect([result.columns, result.rows, result.stitches, result.totalYards]).toEqual([0, 0, 0, 0]);
    expect(result.svg.chart).toContain("<svg");
  });
});

describe("colors", () => {
  it("counts each color, and the counts sum to the stitched cells", () => {
    const result = generateCrossStitch(req);
    expect(result.colors.map((c) => c.stitches)).toEqual([3, 3, 1]);
    expect(result.colors.reduce((sum, c) => sum + c.stitches, 0)).toBe(result.stitches);
    expect(result.stitches).toBe(grid.join("").replace(/\./g, "").length);
  });

  it.each(MOTIFS.map((m) => [m.id, m] as const))("sums to the grid for the %s motif", (_, motif) => {
    const result = generateCrossStitch({ ...req, grid: motif.grid, colors: motif.colors });
    expect(result.colors.reduce((sum, c) => sum + c.stitches, 0)).toBe(motif.grid.join("").replace(/\./g, "").length);
  });

  it("gives every color its own symbol", () => {
    expect(new Set(SYMBOLS).size).toBe(SYMBOLS.length);
    expect(generateCrossStitch(req).colors.map((c) => c.symbol)).toEqual(SYMBOLS.slice(0, 3));
  });

  it("refuses a grid that uses a color it wasn't given", () => {
    expect(() => countStitches(["ad"], 2)).toThrow();
  });

  it("names no thread maker", () => {
    expect(JSON.stringify([engineText, siteText, MOTIFS])).not.toMatch(/\b(DMC|Anchor|Madeira|Cosmo|Appleton|Paternayan)\b/i);
  });
});

describe("thread estimate", () => {
  it("follows the stitch path, per stitch and strand, with the allowance", () => {
    // 1000 crosses on 14 count: 4.828" of path / 14, x 2/6 of a six-strand length, x 1.25, in yards.
    expect(threadYards(1000, { craft: "cross", count: 14, strands: 2 })).toBeCloseTo(4, 0);
    const expected = (1000 * ((2 * Math.SQRT2 + 2) / 14) * (2 / 6) * 1.25) / 36;
    expect(threadYards(1000, { craft: "cross", count: 14, strands: 2 })).toBeGreaterThanOrEqual(expected);
    expect(threadYards(1000, { craft: "cross", count: 14, strands: 2 })).toBeLessThan(expected + 0.1);
  });

  it("uses more with more strands and a lower count", () => {
    const at = (count: number, strands: number) => threadYards(5000, { craft: "cross", count, strands });
    expect(at(14, 3)).toBeGreaterThan(at(14, 2));
    expect(at(11, 2)).toBeGreaterThan(at(18, 2));
  });

  it("ignores strands for needlepoint, which is given as thread in the needle", () => {
    expect(threadYards(1000, { craft: "needlepoint", count: 13, strands: 1 })).toBe(threadYards(1000, { craft: "needlepoint", count: 13, strands: 6 }));
  });

  it("needs nothing for no stitches", () => {
    expect(threadYards(0, req)).toBe(0);
  });
});

describe("motifs", () => {
  it.each(MOTIFS.map((m) => [m.id, m] as const))("%s is rectangular, in range, uses all its colors, and has a name", (id, motif) => {
    const width = motif.grid[0].length;
    expect(motif.grid.every((row) => row.length === width), "rows differ").toBe(true);
    expect(width).toBeGreaterThanOrEqual(MIN_GRID);
    expect(width).toBeLessThanOrEqual(MAX_GRID);
    expect(motif.grid.length).toBeGreaterThanOrEqual(MIN_GRID);
    expect(motif.grid.length).toBeLessThanOrEqual(MAX_GRID);
    expect(countStitches(motif.grid, motif.colors.length).every((n) => n > 0)).toBe(true);
    for (const locale of LOCALES) expect(siteText[locale].motifs[id]).toBeTruthy();
  });
});

describe("share links", () => {
  it("are empty for the default, in every language", () => {
    for (const locale of LOCALES) expect(serializeCrossStitchState(defaultCrossStitchState(locale))).toBe("");
  });

  it("give each language its own opening colors", () => {
    const colors = LOCALES.map((locale) => defaultCrossStitchState(locale).colors.join());
    expect(new Set(colors).size).toBe(LOCALES.length);
  });

  it.each(LOCALES)("round trip every setting in %s", (locale) => {
    const base = defaultCrossStitchState(locale);
    const states: CrossStitchRequest[] = [
      { ...base, count: 18, strands: 3, margin: 5, fabric: "#222222" },
      { ...base, craft: "needlepoint", count: 18 },
      { ...base, craft: "needlepoint", count: DEFAULT_COUNT.needlepoint },
      { ...base, colors: ["#101010", "#202020", "#303030", "#404040"] },
      { ...base, grid: MOTIFS[3].grid, colors: MOTIFS[3].colors },
      { ...base, grid: setCell(base.grid, 0, 0, "c") },
      { ...base, grid: resizeGrid(base.grid, MAX_GRID, MAX_GRID) },
      { ...base, grid: resizeGrid([], 8, 8), colors: ["#101010"] },
    ];
    for (const state of states) {
      expect(parseCrossStitchState(params(serializeCrossStitchState(state)), locale)).toEqual(state);
    }
  });

  it("name a motif rather than spelling out its grid", () => {
    expect(serializeCrossStitchState({ ...defaultCrossStitchState(), grid: MOTIFS[1].grid, colors: MOTIFS[1].colors })).toBe("m=heart");
  });

  it.each(["m=heart", "m=pine&count=18", "m=sailboat&craft=needlepoint", "m=diamonds&c=7a4b9a-2f8f9d-1a1a1a"])("keep the deep link %s", (query) => {
    expect(serializeCrossStitchState(parseCrossStitchState(params(query)))).toBe(query);
  });

  it.each(["count=15", "count=abc", "strands=5", "margin=99", "f=zzz", "m=nope", "c=notcolor", "c=", "g=xyz", "g=99999999a", "g=8a-8a", "g=8a-7a-8a-8a-8a-8a-8a-8a", "g=0a", "craft=knit", "count=10"])(
    "fall back to the default on the bad value %s",
    (query) => {
      expect(parseCrossStitchState(params(query))).toEqual(defaultCrossStitchState());
    },
  );

  it("keep the good settings when another is bad", () => {
    const state = parseCrossStitchState(params("count=18&strands=5&m=nope"));
    expect(state).toEqual({ ...defaultCrossStitchState(), count: 18 });
  });

  it("use a count only with the craft that offers it", () => {
    expect(parseCrossStitchState(params("craft=needlepoint&count=11")).count).toBe(DEFAULT_COUNT.needlepoint);
    expect(parseCrossStitchState(params("craft=needlepoint&count=10")).count).toBe(10);
  });

  it("ignore colors too few for the grid, rather than give a chart it can't draw", () => {
    const state = parseCrossStitchState(params("m=cottage&c=101010"));
    expect(state.colors).toEqual(MOTIFS[3].colors);
    expect(() => generateCrossStitch(state)).not.toThrow();
  });

  it("give a hand-made grid enough colors", () => {
    const state = parseCrossStitchState(params("g=8a-8b-8c-8d-8e-8f-8g-8h"));
    expect(state.colors).toHaveLength(8);
    expect(generateCrossStitch(state).stitches).toBe(64);
  });
});

describe("grid editing", () => {
  it("paints one cell", () => {
    expect(setCell(["....", "...."], 1, 2, "b")).toEqual(["....", "..b."]);
  });

  it("resizes from the top left, filling with bare fabric", () => {
    expect(resizeGrid(["ab", "cd"], 3, 3)).toEqual(["ab.", "cd.", "..."]);
    expect(resizeGrid(["abc", "def", "ghc"], 2, 1)).toEqual(["ab"]);
  });

  it("removes a color's stitches and keeps the other colors on their stitches", () => {
    const result = removeColor(req, 1);
    expect(result.colors).toEqual(["#111111", "#333333"]);
    expect(result.grid.slice(1, 4)).toEqual(["..aa....", "..a.....", "...b...."]);
    expect(generateCrossStitch({ ...req, ...result }).colors.map((c) => c.stitches)).toEqual([3, 1]);
  });
});

describe("output", () => {
  it("sizes the stitched SVG at true scale", () => {
    const { stitched } = generateCrossStitch({ ...req, count: 10 }).svg;
    expect(stitched).toContain('viewBox="0 0 3 3"');
    expect(stitched).toContain('width="0.3in"');
  });

  it("charts one symbol per stitch", () => {
    const { chart } = generateCrossStitch(req).svg;
    const symbols = [...chart.matchAll(/<text [^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
    expect(symbols.filter((s) => s === "X")).toHaveLength(3);
    expect(symbols.filter((s) => s === "O")).toHaveLength(3);
    expect(symbols.filter((s) => s === "+")).toHaveLength(1);
  });

  it("numbers the chart every 10 stitches", () => {
    const { chart } = generateCrossStitch({ ...req, grid: resizeGrid(["a".repeat(25)], 25, 12) }).svg;
    expect(chart).toContain(">10</text>");
    expect(chart).toContain(">20</text>");
  });

  it("changes the words, not the numbers, between languages", () => {
    const en = generateCrossStitch(req);
    for (const locale of LOCALES.slice(1)) {
      const translated = generateCrossStitch({ ...req, locale });
      expect(translated.colors).toEqual(en.colors);
      expect([translated.width, translated.height, translated.fabricWidth]).toEqual([en.width, en.height, en.fabricWidth]);
      expect(translated.steps).not.toEqual(en.steps);
    }
  });

  it.each(LOCALES)("builds a %s chart, for both crafts and any color count", async (locale) => {
    const base = defaultCrossStitchState(locale);
    const eight = { ...base, grid: ["a", "b", "c", "d", "e", "f", "g", "h"].map((c) => c.repeat(MAX_GRID)), colors: Array<string>(8).fill("#123456") };
    for (const state of [base, { ...base, craft: "needlepoint" as const, count: 13 }, { ...base, strands: 1 }, eight, { ...base, grid: resizeGrid([], 8, 8) }]) {
      const doc = await PDFDocument.load(await generateCrossStitchPdf(state));
      // Details and the chart, which always starts a page of its own.
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(generateCrossStitch(state).steps)).not.toMatch(/\{\w+\}/);
    }
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
] as const)("%s text", (_, catalog) => {
  const english = new Map(leaves(catalog.en));

  it.each(LOCALES)("%s has the same keys and placeholders as English, none empty", (locale) => {
    const translated = new Map(leaves(catalog[locale]));
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of translated) {
      expect(text, key).not.toBe("");
      expect(placeholders(text), key).toEqual(placeholders(english.get(key)!));
    }
  });

  it.each(LOCALES.slice(1))("%s isn't still English", (locale) => {
    const translated = leaves(catalog[locale]);
    const same = translated.filter(([key, text]) => text === english.get(key));
    expect(same.length / translated.length).toBeLessThan(0.1);
  });
});
