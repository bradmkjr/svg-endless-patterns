import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import siteText from "../i18n/messages/stainedGlass.json";
import { defaultStainedGlassState, CAME_WIDTHS, GLASS_SIDES, HEART_WIDTHS, parseStainedGlassState, serializeStainedGlassState } from "../lib/stainedGlassState";
import { LOCALES } from "./i18n";
import engineText from "./messages/stainedGlass.json";
import type { Point } from "./pieces";
import { buildPieces, cornerAngles, cuttingFaults, fitPanel, generateStainedGlass, LAYOUT_IDS, LIMITS, measure, polygonArea, WASTE, type StainedGlassLayout, type StainedGlassRequest } from "./stainedGlass";
import { generateStainedGlassPdf, OVERLAP, planTemplates } from "./stainedGlassPdf";

const COLORS = ["#111111", "#222222", "#333333", "#444444"];
const request = (layout: StainedGlassLayout, width: number, height: number, detail = 3): StainedGlassRequest => ({ layout, width, height, detail, cameWidth: 0.25, heartWidth: 0.0625, colors: COLORS });
const SIZES: [number, number][] = [[8, 8], [8, 20], [20, 8], [10, 12], [14, 12], [18, 18], [24, 12], [36, 36], [36, 16], [16, 36]];

function contains(points: Point[], x: number, y: number): boolean {
  return points.every(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax) > 0;
  });
}

describe.each(LAYOUT_IDS)("%s layout", (layout) => {
  it.each(SIZES)("fills a %i x %i panel exactly, with no gaps or overlap", (w, h) => {
    for (const detail of [1, 2, 3]) {
      const pieces = buildPieces(request(layout, w, h), detail);
      expect(pieces.reduce((sum, p) => sum + polygonArea(p.line), 0)).toBeCloseTo(w * h, 6);
      // Irrational offsets keep samples off every line, so each must land in exactly one piece.
      for (let i = 1; i <= 400; i++) {
        const x = ((i * 0.61803398875) % 1) * w;
        const y = ((i * 0.75487766625 + 0.137) % 1) * h;
        expect(pieces.filter((p) => contains(p.line, x, y)).length, `${detail} at ${x},${y}`).toBe(1);
      }
    }
  });

  it("is cuttable at every size, came and heart the builder offers, with detail 1 as the guarantee", () => {
    for (const width of GLASS_SIDES) {
      for (const height of GLASS_SIDES) {
        for (const cameWidth of CAME_WIDTHS) {
          for (const heartWidth of HEART_WIDTHS) {
            const result = generateStainedGlass({ layout, width, height, detail: 3, cameWidth, heartWidth, colors: COLORS });
            for (const p of result.pieces) expect(cuttingFaults(p.line, p.cut, p.sight), `${width}x${height} ${cameWidth} no. ${p.number}`).toEqual([]);
          }
        }
      }
    }
  }, 200000);

  it.each(SIZES)("measures up to the stated limits at %i x %i, independently of the fault check", (w, h) => {
    const result = generateStainedGlass(request(layout, w, h));
    for (const p of result.pieces) {
      const angles = cornerAngles(p.cut);
      expect(Math.min(...angles)).toBeGreaterThanOrEqual(LIMITS.minAngle - 1e-6);
      // No reflex corners, and no straight-through vertex that would hide one.
      expect(Math.max(...angles)).toBeLessThan(180);
      expect(angles.reduce((a, b) => a + b, 0)).toBeCloseTo((p.cut.length - 2) * 180, 6);
      expect(measure(p.cut).width).toBeGreaterThanOrEqual(LIMITS.minCutWidth - 1e-6);
      expect(measure(p.sight).width).toBeGreaterThanOrEqual(LIMITS.minSightWidth - 1e-6);
    }
  });

  it("shrinks each piece into a valid polygon nested inside its line", () => {
    const result = generateStainedGlass({ ...request(layout, 18, 18), cameWidth: 0.5, heartWidth: 0.09375 });
    for (const p of result.pieces) {
      expect(p.cut).toHaveLength(p.line.length);
      expect(p.sight).toHaveLength(p.line.length);
      expect(polygonArea(p.sight)).toBeLessThan(polygonArea(p.cut));
      expect(polygonArea(p.cut)).toBeLessThan(polygonArea(p.line));
      for (const [x, y] of p.cut) expect(contains(p.line, x, y)).toBe(true);
      for (const [x, y] of p.sight) expect(contains(p.cut, x, y)).toBe(true);
    }
  });

  it("numbers pieces 1 to n, once each", () => {
    const { pieces } = generateStainedGlass(request(layout, 24, 18));
    expect(pieces.map((p) => p.number)).toEqual(pieces.map((_, i) => i + 1));
  });

  it("totals glass from the pieces plus the stated waste", () => {
    const result = generateStainedGlass(request(layout, 24, 18));
    expect(result.wastePercent).toBe(WASTE * 100);
    result.colors.forEach((c, i) => {
      const own = result.pieces.filter((p) => p.color === i);
      const area = own.reduce((sum, p) => sum + p.area, 0);
      expect(c.pieces).toBe(own.length);
      expect(c.cutArea).toBeCloseTo(area, 1);
      expect(c.needed).toBeCloseTo(area * (1 + WASTE), 1);
      expect(c.squareFeet).toBeCloseTo((area * (1 + WASTE)) / 144, 2);
    });
    expect(result.colors.reduce((sum, c) => sum + c.pieces, 0)).toBe(result.pieces.length);
  });

  it("plans true-size templates that stay on the page, without collisions, covering oversize pieces", () => {
    const { pieces } = generateStainedGlass({ ...request(layout, 36, 36), detail: 1 });
    const { sheets, tiled } = planTemplates(pieces);
    const seen = new Set<number>();
    for (const sheet of sheets) {
      for (const a of sheet) {
        seen.add(a.number);
        expect(a.x).toBeGreaterThanOrEqual(36);
        expect(a.x + a.window.w).toBeLessThanOrEqual(576 + 1e-6);
        expect(a.y + a.window.h).toBeLessThanOrEqual(756 + 1e-6);
        for (const b of sheet) {
          if (a === b) continue;
          const apart = a.x + a.window.w <= b.x || b.x + b.window.w <= a.x || a.y + a.window.h <= b.y || b.y + b.window.h <= a.y;
          expect(apart).toBe(true);
        }
      }
    }
    expect(seen.size).toBe(pieces.length);
    for (const place of sheets.flat().filter((s) => s.of === 1)) {
      // Unscaled: the window is the piece's bounding box at 72 points to the inch.
      const piece = pieces[place.number - 1];
      const xs = piece.cut.map(([x]) => x);
      expect(place.window.w).toBeCloseTo((Math.max(...xs) - Math.min(...xs)) * 72, 6);
    }
    for (const number of tiled) {
      const piece = pieces[number - 1];
      const [minX, minY] = [Math.min(...piece.cut.map(([x]) => x)), Math.min(...piece.cut.map(([, y]) => y))];
      const windows = sheets.flat().filter((s) => s.number === number);
      expect(windows.length).toBeGreaterThan(1);
      expect(windows.every((s) => s.of === windows.length)).toBe(true);
      for (let t = 0; t < 40; t++) {
        const i = t % piece.cut.length;
        const a = piece.cut[i];
        const b = piece.cut[(i + 1) % piece.cut.length];
        const [x, y] = [(a[0] + ((b[0] - a[0]) * t) / 40 - minX) * 72, (a[1] + ((b[1] - a[1]) * t) / 40 - minY) * 72];
        expect(windows.some((s) => x >= s.window.x - 1e-6 && x <= s.window.x + s.window.w + 1e-6 && y >= s.window.y - 1e-6 && y <= s.window.y + s.window.h + 1e-6), `no. ${number}`).toBe(true);
      }
    }
    expect(OVERLAP).toBe(36);
  });
});

describe("limits", () => {
  it("flags shapes that break the rules", () => {
    const square: Point[] = [[0, 0], [4, 0], [4, 4], [0, 4]];
    expect(cuttingFaults(square, square, square)).toEqual([]);
    const sliver: Point[] = [[0, 0], [10, 0], [10, 1]];
    expect(cuttingFaults(sliver, sliver, sliver)).toContain("sharp corner");
    const thin: Point[] = [[0, 0], [10, 0], [10, 0.5], [0, 0.5]];
    expect(cuttingFaults(thin, thin, thin)).toEqual(expect.arrayContaining(["narrow glass", "long sliver"]));
    const notch: Point[] = [[0, 0], [4, 0], [4, 4], [2, 1], [0, 4]];
    expect(cuttingFaults(notch, notch, notch)).toContain("inside corner");
  });

  it("applies the heart as the allowance: half between pieces, whole at the panel edge", () => {
    const { pieces } = generateStainedGlass({ ...request("medallion", 18, 18), detail: 1 });
    const block = pieces.find((p) => p.line.every(([x, y]) => x <= 2.5 + 1e-9 && y <= 2.5 + 1e-9))!;
    const xs = block.cut.map(([x]) => x);
    expect(Math.min(...xs)).toBeCloseTo(0.0625, 6);
    expect(Math.max(...xs)).toBeCloseTo(2.5 - 0.03125, 6);
  });

  it("clamps out-of-range panels and says so", () => {
    expect(fitPanel(8, 36)).toEqual({ width: 8, height: 20, changed: true });
    expect(fitPanel(4, 100)).toEqual({ width: 8, height: 20, changed: true });
    const result = generateStainedGlass(request("rose", 8, 36));
    expect(result.height).toBe(20);
    expect(result.notes.join(" ")).toContain('8" x 20"');
  });

  it("says when it lowers the detail, and flags big panels", () => {
    const small = generateStainedGlass(request("rose", 8, 8, 3));
    expect(small.detail).toBeLessThan(3);
    expect(small.notes.some((n) => n.includes("lowered"))).toBe(true);
    expect(generateStainedGlass(request("rose", 30, 30)).notes.some((n) => n.includes("reinforcing"))).toBe(true);
    expect(generateStainedGlass({ ...request("medallion", 36, 36), detail: 1 }).notes.some((n) => n.includes("sheet"))).toBe(true);
  });
});

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

  it.each(["l=sunburst&w=24&d=3", "l=quarries&w=12&h=24", "l=medallion&w=20&h=20&d=3"])("keeps the announcement sample %s", (query) => {
    expect(serializeStainedGlassState(parseStainedGlassState(params(query))).split("&").sort()).toEqual(query.split("&").sort());
    expect(generateStainedGlass(parseStainedGlassState(params(query))).pieces.length).toBeGreaterThan(4);
  });
});

function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  return Object.entries(value as object).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe.each([["engine", engineText], ["site", siteText]] as const)("%s text", (_, catalog) => {
  it.each(LOCALES)("%s has every key, with the same placeholders, none empty", (locale) => {
    const english = new Map(leaves(catalog.en));
    const own = new Map(leaves(catalog[locale]));
    expect([...own.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, value] of own) {
      expect(value.trim(), key).not.toBe("");
      expect(placeholders(value), key).toEqual(placeholders(english.get(key)!));
    }
  });
});

describe("pdf", () => {
  it.each(LOCALES)("builds in %s, with no unfilled text", async (locale) => {
    const req = { ...request("rose", 18, 18), locale };
    const doc = await PDFDocument.load(await generateStainedGlassPdf(req));
    const { sheets } = planTemplates(generateStainedGlass(req).pieces);
    expect(doc.getPageCount()).toBe(2 + sheets.length);
    const result = generateStainedGlass(req);
    expect(JSON.stringify([result.rules, result.steps, result.notes])).not.toMatch(/\{\w+\}|undefined/);
  });

  it.each(LAYOUT_IDS)("builds a large %s with tiled pieces", async (layout) => {
    const doc = await PDFDocument.load(await generateStainedGlassPdf({ ...request(layout, 36, 36), detail: 1 }));
    expect(doc.getPageCount()).toBeGreaterThan(2);
  });

  it("uses only characters the PDF font can draw", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of leaves(engineText[locale])) expect(value, key).toMatch(/^[\x20-\x7e -ÿ]*$/);
    }
  });
});
