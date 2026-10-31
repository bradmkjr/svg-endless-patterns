import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import uiCopy from "../i18n/messages/truchet.json";
import { ARRANGEMENT_OPTIONS, defaultTruchetState, GRID_OPTIONS, parseTruchetState, REPEAT_OPTIONS, serializeTruchetState, STYLE_OPTIONS } from "../lib/truchetState";
import engineCopy from "./messages/truchet.json";
import { generateTruchet, orientations, TILE_UNITS as U, TRUCHET_ARRANGEMENTS, TRUCHET_STYLES, truchetOrientations, type TruchetRequest, type TruchetStyle } from "./truchet";
import { generateTruchetPdf } from "./truchetPdf";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const req: TruchetRequest = { style: "arcs", arrangement: "random", grid: 6, weight: 20, seed: 42, colors: { background: "#ffffff", line: "#111111", accent: "#cc0000" }, repeatWidth: 3 };

type Pt = [number, number];
type Sub = { points: Pt[]; closed: boolean };
type Path = { subs: Sub[]; wrapped: boolean };
type Group = { color: string; width: number; filled: boolean; paths: Path[] };

/** Reads the SVG itself back into paths, curves flattened, so these tests see what a viewer draws. */
function readSvg(svg: string): Group[] {
  return [...svg.matchAll(/<g fill="([^"]+)" stroke="([^"]+)" stroke-width="([\d.]+)"[^>]*>(.*?)<\/g>/g)].map(([, fill, stroke, width, body]) => ({
    color: stroke,
    width: Number(width),
    filled: fill !== "none",
    paths: [...body.matchAll(/<path( data-wrap="1")? d="([^"]+)"\/>/g)].map(([, wrap, d]) => ({ wrapped: !!wrap, subs: readPath(d) })),
  }));
}

function readPath(d: string): Sub[] {
  const subs: Sub[] = [];
  for (const [, cmd, raw] of d.matchAll(/([MLAZ])([^MLAZ]*)/g)) {
    const n = raw.trim().split(/\s+/).filter(Boolean).map(Number);
    const sub = subs[subs.length - 1];
    if (cmd === "M") subs.push({ points: [[n[0], n[1]]], closed: false });
    else if (cmd === "L") sub.points.push([n[0], n[1]]);
    else if (cmd === "Z") sub.closed = true;
    else {
      // A quarter circle: its center is the corner of the bounding square on the sweep's inner side.
      const [x0, y0] = sub.points[sub.points.length - 1];
      const [r, sweep, x1, y1] = [n[0], n[4], n[5], n[6]];
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const s = sweep ? 1 : -1;
      const cx = mx - (s * (y1 - y0)) / 2;
      const cy = my + (s * (x1 - x0)) / 2;
      const a0 = Math.atan2(y0 - cy, x0 - cx);
      expect(Math.hypot(x0 - cx, y0 - cy)).toBeCloseTo(r, 6);
      for (let i = 1; i <= 24; i++) {
        const a = a0 + ((s * Math.PI) / 2) * (i / 24);
        sub.points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
    }
  }
  return subs;
}

function segmentDistance([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function inPolygon([x, y]: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function covers(group: Group, sub: Sub, p: Pt): boolean {
  if (group.filled && inPolygon(p, sub.points)) return true;
  const pts = sub.closed ? [...sub.points, sub.points[0]] : sub.points;
  return pts.slice(1).some((b, i) => segmentDistance(p, pts[i], b) <= group.width / 2);
}

/** The color at a point: the last group that covers it, as in painting order. */
function colorAt(groups: Group[], p: Pt, background: string): string {
  let found = background;
  for (const group of groups) {
    if (group.paths.some((path) => path.subs.some((sub) => covers(group, sub, p)))) found = group.color;
  }
  return found;
}

/** Points in a band along every edge of the repeat, off the tile lattice. */
function edgePoints(side: number, band: number): Pt[] {
  const points: Pt[] = [];
  for (let along = 3.3; along < side; along += 7.7) {
    for (let d = 0.4; d < band; d += 2.9) {
      points.push([d, along], [side - d, along], [along, d], [along, side - d]);
    }
  }
  return points;
}

/** The first point where the repeat differs from an endless field of itself, or null. */
function seamFault(request: TruchetRequest, svg: string): Pt | null {
  const side = request.grid * U;
  const groups = readSvg(svg);
  const shifted = (dx: number, dy: number) => (s: Sub) => ({ ...s, points: s.points.map(([x, y]): Pt => [x + dx, y + dy]) });
  // Every neighboring copy of the repeat, painted in the same order. Only this repeat's own colors should show.
  const offsets = [-side, 0, side].flatMap((dx) => [-side, 0, side].map((dy): Pt => [dx, dy]));
  const field: Group[] = groups.map((g) => ({ ...g, paths: offsets.flatMap(([dx, dy]) => g.paths.map((path) => ({ ...path, subs: path.subs.map(shifted(dx, dy)) }))) }));
  for (const p of edgePoints(side, Math.max(request.weight, 4))) {
    if (colorAt(groups, p, request.colors.background) !== colorAt(field, p, request.colors.background)) return p;
  }
  return null;
}

/** Where a tile's lines end, with the far edge folded onto the near one. */
function foldedEnds(svg: string, side: number) {
  const ends = new Map<string, number>();
  for (const group of readSvg(svg)) {
    for (const path of group.paths.filter((p) => !p.wrapped)) {
      for (const sub of path.subs) {
        for (const [x, y] of [sub.points[0], sub.points[sub.points.length - 1]]) {
          const key = `${((Math.round(x) % side) + side) % side},${((Math.round(y) % side) + side) % side}`;
          ends.set(key, (ends.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return ends;
}

describe("seamless repeat", () => {
  it.each(["arcs", "chamfers"] as TruchetStyle[])("%s: every line end meets exactly one other, including across the wrap", (style) => {
    for (const arrangement of TRUCHET_ARRANGEMENTS) {
      const request = { ...req, style, arrangement };
      const side = request.grid * U;
      const ends = foldedEnds(generateTruchet(request).svg.repeat, side);
      // Each tile has four line ends, and each of the 2 x grid x grid edges carries one join.
      expect(ends.size).toBe(2 * request.grid * request.grid);
      for (const count of ends.values()) expect(count).toBe(2);
      // Joins on the fold are the ones made across the wrap: the left edge to the right, the top to the bottom.
      for (let i = 0; i < request.grid; i++) {
        expect(ends.get(`0,${i * U + U / 2}`)).toBe(2);
        expect(ends.get(`${i * U + U / 2},0`)).toBe(2);
      }
    }
  });

  it.each(TRUCHET_STYLES.flatMap((style) => TRUCHET_ARRANGEMENTS.map((arrangement) => [style, arrangement] as const)))("%s, %s: edges match an endless field of itself", (style, arrangement) => {
    const request = { ...req, style, arrangement, grid: 4, weight: 30 };
    expect(seamFault(request, generateTruchet(request).svg.repeat)).toBeNull();
  });

  it("the check above fails without the copies across the wrap", () => {
    const request = { ...req, style: "diagonals" as const, grid: 4, weight: 30 };
    const svg = generateTruchet(request).svg.repeat;
    expect(svg).toContain("data-wrap");
    expect(seamFault(request, svg.replace(/<path data-wrap="1" d="[^"]+"\/>/g, ""))).not.toBeNull();
  });
});

describe("arrangements", () => {
  it("gives the same tiles and the same file for the same seed", () => {
    for (const style of TRUCHET_STYLES) {
      expect(generateTruchet({ ...req, style }).svg.repeat).toBe(generateTruchet({ ...req, style }).svg.repeat);
    }
  });

  it("is pinned to a known sequence, so a seed keeps its meaning across releases", () => {
    expect(truchetOrientations({ style: "arcs", arrangement: "random", grid: 4, seed: 1 })).toEqual(PINNED);
  });

  it("gives different tiles for different seeds", () => {
    const seen = new Set(Array.from({ length: 30 }, (_, seed) => generateTruchet({ ...req, seed }).svg.repeat));
    expect(seen.size).toBe(30);
  });

  it("ignores the seed only where it isn't used", () => {
    for (const arrangement of TRUCHET_ARRANGEMENTS) {
      const a = generateTruchet({ ...req, arrangement, seed: 1 });
      const b = generateTruchet({ ...req, arrangement, seed: 2 });
      expect(a.seeded).toBe(arrangement === "random" || arrangement === "mirror");
      expect(a.svg.repeat === b.svg.repeat).toBe(!a.seeded);
    }
  });

  it("mirrors the top-left quarter, with each tile flipped", () => {
    const g = 8;
    const across = truchetOrientations({ ...req, grid: g, arrangement: "mirror" });
    for (let r = 0; r < g; r++) for (let c = 0; c < g; c++) expect(across[r][g - 1 - c]).toBe(across[r][c] ^ 1);
    const triangles = truchetOrientations({ ...req, style: "triangles", grid: g, arrangement: "mirror" });
    for (let r = 0; r < g; r++) for (let c = 0; c < g; c++) expect(triangles[g - 1 - r][c]).toBe(3 - triangles[r][c]);
  });

  it("alternates in a checkerboard", () => {
    const rows = truchetOrientations({ ...req, grid: 4, arrangement: "checker" });
    expect(rows).toEqual([[0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 1, 0]]);
  });

  it("uses every turn of a tile", () => {
    for (const style of TRUCHET_STYLES) {
      expect(new Set(truchetOrientations({ ...req, style, grid: 24 }).flat()).size).toBe(orientations(style));
    }
  });
});

describe("output", () => {
  it.each(GRID_OPTIONS)("draws %i tiles a side, one path each, plus marked copies", (grid) => {
    for (const style of TRUCHET_STYLES) {
      const result = generateTruchet({ ...req, grid, style });
      const own = readSvg(result.svg.repeat).flatMap((g) => g.paths).filter((p) => !p.wrapped);
      expect(own).toHaveLength(grid * grid);
      expect(result.tiles).toBe(grid * grid);
      expect(result.svg.repeat).toContain(`viewBox="0 0 ${grid * U} ${grid * U}"`);
    }
  });

  it("sets the line weight, and leaves it out of filled tiles", () => {
    expect(readSvg(generateTruchet({ ...req, weight: 16 }).svg.repeat)[0].width).toBe(16);
    expect(generateTruchet({ ...req, style: "triangles", weight: 16 }).svg.repeat).toBe(generateTruchet({ ...req, style: "triangles", weight: 30 }).svg.repeat);
  });

  it("sizes the repeat at true scale, in the form PNG export expects", () => {
    expect(generateTruchet({ ...req, repeatWidth: 7.5 }).svg.repeat).toMatch(/width="7\.5in" height="7\.5in"/);
    expect(generateTruchet({ ...req, repeatWidth: 7.5 }).repeat).toBe('7.5"');
  });

  it.each(LOCALES)("builds a %s PDF for every tile and page size", async (locale) => {
    for (const style of TRUCHET_STYLES) {
      for (const repeatWidth of [REPEAT_OPTIONS[0], REPEAT_OPTIONS[REPEAT_OPTIONS.length - 1]]) {
        const doc = await PDFDocument.load(await generateTruchetPdf({ ...defaultTruchetState(locale), style, repeatWidth, grid: 4 }));
        expect(doc.getPageCount()).toBe(2);
      }
    }
  });

  it("all PDF text can be set in Helvetica", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const locale of LOCALES) for (const value of Object.values(engineCopy[locale])) expect(() => font.encodeText(value)).not.toThrow();
  });
});

describe("share links", () => {
  const full: TruchetRequest = { style: "triangles", arrangement: "waves", grid: 16, weight: 6, seed: 12345, colors: { background: "#010203", line: "#a0b0c0", accent: "#ffeedd" }, repeatWidth: 7.5 };

  it("keeps the options in step with the engine", () => {
    expect(STYLE_OPTIONS).toEqual([...TRUCHET_STYLES]);
    expect(ARRANGEMENT_OPTIONS).toEqual([...TRUCHET_ARRANGEMENTS]);
  });

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    const base = defaultTruchetState(locale);
    expect(serializeTruchetState(base)).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseTruchetState(new URLSearchParams(serializeTruchetState(state)), locale)).toEqual(state);
  });

  it("uses every grid in the list as even, for layouts that must wrap", () => {
    for (const grid of GRID_OPTIONS) expect(grid % 2).toBe(0);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultTruchetState();
    const bad = "style=hexagons&a=spiral&g=7&w=999&seed=-3&bg=red&ln=12345&ac=gggggg&r=100";
    expect(parseTruchetState(new URLSearchParams(bad))).toEqual(base);
    expect(parseTruchetState(new URLSearchParams("g=abc&seed=1.5&style=arcs%00"))).toEqual(base);
    expect(parseTruchetState(new URLSearchParams("g=12&w=999")).grid).toBe(12);
    expect(parseTruchetState(new URLSearchParams("g=12&w=999")).weight).toBe(base.weight);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => JSON.stringify(defaultTruchetState(l).colors))).size).toBe(5);
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it.each([["engine", engineCopy], ["site", uiCopy]] as const)("%s text has the same keys and placeholders in every language", (_, copy) => {
    const english = Object.fromEntries(leaves(copy.en));
    for (const locale of LOCALES) {
      const here = Object.fromEntries(leaves(copy[locale]));
      expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(here)) {
        expect(text.trim()).not.toBe("");
        expect(holes(text)).toEqual(holes(english[key]));
      }
    }
  });
});

const PINNED: number[][] = [];
