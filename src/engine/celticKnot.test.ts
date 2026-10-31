import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import uiText from "../i18n/messages/celticKnot.json";
import { BREAK_PATTERNS, drawKnot, generateCelticKnot, placeBreaks, traceKnot, traceStrands, type CelticKnotRequest, type KnotBreak, type KnotStop } from "./celticKnot";
import { generateCelticKnotPdf } from "./celticKnotPdf";
import { LOCALES } from "./i18n";
import engineText from "./messages/celticKnot.json";
import { defaultCelticKnotState, parseCelticKnotState, PATTERN_OPTIONS, serializeCelticKnotState } from "../lib/celticKnotState";

const req: CelticKnotRequest = { cols: 6, rows: 4, pattern: "mirror", seed: 7, density: 25, ribbon: 60, interlace: "open", colors: ["#111111", "#222222", "#333333"], perStrand: true, background: "#ffffff", outline: "#000000", size: 8 };

/** Grids and break layouts to check, including seeded ones at several densities. */
const GRIDS = [[2, 2], [2, 3], [3, 3], [4, 4], [5, 3], [6, 6], [7, 4], [8, 8], [9, 5], [12, 7], [16, 16]];
const designs: [string, number, number, KnotBreak[]][] = GRIDS.flatMap(([cols, rows]) =>
  BREAK_PATTERNS.flatMap((pattern) =>
    (pattern === "random" || pattern === "mirror" || pattern === "rotate" ? [5, 25, 60].flatMap((density) => [1, 99, 123456].map((seed) => ({ density, seed }))) : [{ density: 0, seed: 0 }]).map(
      ({ density, seed }): [string, number, number, KnotBreak[]] => [`${cols}x${rows} ${pattern} d${density} s${seed}`, cols, rows, placeBreaks(cols, rows, pattern, seed, density)],
    ),
  ),
);

const key = (s: { x: number; y: number }) => `${s.x},${s.y}`;

/** Every interior site that isn't a break, worked out without the tracer. */
function expectedCrossings(cols: number, rows: number, breaks: KnotBreak[]): string[] {
  const walls = new Set(breaks.map(key));
  const sites: string[] = [];
  for (let y = 1; y < rows * 2; y++) for (let x = 1; x < cols * 2; x++) if ((x + y) % 2 && !walls.has(`${x},${y}`)) sites.push(`${x},${y}`);
  return sites;
}

/** True if each stop follows from the last by one diagonal step, reflecting only at walls, and the last leads back to the first. */
function followsLattice(stops: KnotStop[]): boolean {
  return stops.every((s, i) => {
    const next = stops[(i + 1) % stops.length];
    const dx = s.wall === "v" ? -s.dx : s.dx;
    const dy = s.wall === "h" ? -s.dy : s.dy;
    return next.dx === dx && next.dy === dy && next.x === s.x + dx && next.y === s.y + dy;
  });
}

describe("strands", () => {
  it("has real designs to check", () => {
    expect(designs.length).toBeGreaterThan(200);
    expect(designs.filter(([, , , breaks]) => breaks.length > 0).length).toBeGreaterThan(150);
  });

  it.each(designs)("%s: every strand is a closed loop along the lattice", (_, cols, rows, breaks) => {
    for (const stops of traceStrands(cols, rows, breaks)) {
      expect(stops.length).toBeGreaterThanOrEqual(4);
      expect(followsLattice(stops)).toBe(true);
    }
  });

  it.each(designs)("%s: every crossing is visited exactly twice, once over and once under", (_, cols, rows, breaks) => {
    const visits = new Map<string, boolean[]>();
    for (const stops of traceStrands(cols, rows, breaks)) {
      for (const s of stops) {
        if (!s.wall) visits.set(key(s), [...(visits.get(key(s)) ?? []), s.over]);
      }
    }
    expect([...visits.keys()].sort()).toEqual(expectedCrossings(cols, rows, breaks).sort());
    for (const [site, passes] of visits) {
      expect(passes.length, site).toBe(2);
      expect(passes[0], site).not.toBe(passes[1]);
    }
  });

  it.each(designs)("%s: over and under strictly alternate along each strand", (_, cols, rows, breaks) => {
    for (const stops of traceStrands(cols, rows, breaks)) {
      const passes = stops.filter((s) => !s.wall).map((s) => s.over);
      passes.forEach((over, i) => expect(over).not.toBe(passes[(i + 1) % passes.length]));
    }
  });

  it.each(designs)("%s: walls use every arc exactly once", (_, cols, rows, breaks) => {
    const arcs = traceStrands(cols, rows, breaks).flatMap((stops) => stops.map((s) => `${2 * s.x - s.dx},${2 * s.y - s.dy}`));
    expect(new Set(arcs).size).toBe(arcs.length);
    // Four arcs at each interior site, two at each border site, with each arc shared by two sites.
    const interior = cols * (rows - 1) + rows * (cols - 1);
    expect(arcs.length).toBe((4 * interior + 2 * (2 * cols + 2 * rows)) / 2);
  });

  it("gives a plain plait the known strand count, gcd(cols, rows)", () => {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    for (const [cols, rows] of GRIDS) expect(traceStrands(cols, rows, []).length).toBe(gcd(cols, rows));
  });
});

describe("breaks", () => {
  it("really change the strands", () => {
    const plain = traceStrands(6, 6, []);
    const one = traceStrands(6, 6, [{ x: 5, y: 6, wall: "h" }]);
    expect(one).not.toEqual(plain);
    expect(one.flat().filter((s) => !s.wall).length).toBe(plain.flat().filter((s) => !s.wall).length - 2);
    // One wall joins two of the plain plait's strands, or splits one.
    expect(Math.abs(one.length - plain.length)).toBe(1);
    expect(generateCelticKnot({ ...req, pattern: "mirror", seed: 7 }).svg.art).not.toBe(generateCelticKnot({ ...req, pattern: "none" }).svg.art);
  });

  it("makes every pattern differ from the plain plait on a large enough grid", () => {
    for (const pattern of BREAK_PATTERNS.filter((p) => p !== "none")) {
      expect(placeBreaks(8, 8, pattern, 3, 30).length, pattern).toBeGreaterThan(0);
    }
    expect(placeBreaks(8, 8, "none", 3, 30)).toEqual([]);
  });

  it("are the same for the same seed and differ for another", () => {
    expect(placeBreaks(8, 6, "random", 42, 30)).toEqual(placeBreaks(8, 6, "random", 42, 30));
    expect(placeBreaks(8, 6, "random", 42, 30)).not.toEqual(placeBreaks(8, 6, "random", 43, 30));
    expect(generateCelticKnot({ ...req, pattern: "random", seed: 42 })).toEqual(generateCelticKnot({ ...req, pattern: "random", seed: 42 }));
  });

  it("hold a pinned seeded result, so old share links keep working", () => {
    expect(placeBreaks(4, 3, "random", 1, 30)).toEqual([
      { x: 7, y: 2, wall: "h" },
      { x: 2, y: 3, wall: "h" },
      { x: 1, y: 4, wall: "h" },
      { x: 3, y: 4, wall: "h" },
      { x: 7, y: 4, wall: "h" },
    ]);
  });

  it.each([[8, 6], [7, 5], [6, 6]])("mirror and rotate are symmetric on %i x %i", (cols, rows) => {
    const X = cols * 2;
    const Y = rows * 2;
    const walls = (pattern: "mirror" | "rotate") => new Map(placeBreaks(cols, rows, pattern, 5, 30).map((b) => [key(b), b.wall]));
    const mirror = walls("mirror");
    for (const [site, wall] of mirror) {
      const [x, y] = site.split(",").map(Number);
      expect(mirror.get(`${X - x},${y}`)).toBe(wall);
      expect(mirror.get(`${x},${Y - y}`)).toBe(wall);
    }
    const rotate = walls("rotate");
    for (const [site, wall] of rotate) {
      const [x, y] = site.split(",").map(Number);
      expect(rotate.get(`${X - x},${Y - y}`)).toBe(wall);
      if (cols === rows) expect(rotate.get(`${X - y},${x}`)).toBe(wall === "h" ? "v" : "h");
    }
  });

  it("keeps the fixed patterns symmetric at odd and even grids", () => {
    for (const pattern of ["frame", "cross", "diamond", "lattice"] as const) {
      for (const [cols, rows] of [[8, 8], [7, 8], [9, 5]]) {
        const walls = new Map(placeBreaks(cols, rows, pattern, 0, 0).map((b) => [key(b), b.wall]));
        for (const [site, wall] of walls) {
          const [x, y] = site.split(",").map(Number);
          expect(walls.get(`${cols * 2 - x},${y}`), `${pattern} ${site}`).toBe(wall);
          expect(walls.get(`${x},${rows * 2 - y}`), `${pattern} ${site}`).toBe(wall);
        }
      }
    }
  });
});

/** The polylines in a shape's path data, in lattice-independent SVG units. */
function polylines(d: string): { x: number; y: number }[][] {
  return d
    .split("M")
    .filter(Boolean)
    .map((part) =>
      part
        .replace("Z", "")
        .split("L")
        .map((pair) => {
          const [x, y] = pair.split(" ").map(Number);
          return { x, y };
        }),
    );
}

type P = { x: number; y: number };
function crosses(a: P, b: P, c: P, d: P): boolean {
  const side = (p: P, q: P, r: P) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

function edges(lines: P[][], closed: boolean): [P, P][] {
  return lines.flatMap((line) => line.flatMap((p, i): [P, P][] => (i + 1 < line.length ? [[p, line[i + 1]]] : closed ? [[p, line[0]]] : [])));
}

/** How many edge pairs properly cross, skipping neighbours along the same outline. */
function selfCrossings(all: [P, P][]): number {
  let count = 0;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 2; j < all.length; j++) {
      const [a, b] = all[i];
      const [c, d] = all[j];
      if (Math.max(a.x, b.x) < Math.min(c.x, d.x) || Math.max(c.x, d.x) < Math.min(a.x, b.x) || Math.max(a.y, b.y) < Math.min(c.y, d.y) || Math.max(c.y, d.y) < Math.min(a.y, b.y)) continue;
      if (crosses(a, b, c, d)) count++;
    }
  }
  return count;
}

describe("drawing", () => {
  const layouts: Partial<CelticKnotRequest>[] = [
    { cols: 6, rows: 6, pattern: "none" },
    { cols: 6, rows: 6, pattern: "random", seed: 3, density: 40 },
    { cols: 7, rows: 5, pattern: "diamond" },
    { cols: 8, rows: 8, pattern: "lattice" },
  ];

  it.each(layouts)("cut shapes are closed, filled, and never cross, at the widest ribbon: %o", (patch) => {
    const r = { ...req, ...patch, ribbon: 80 };
    const { cut } = drawKnot(r, traceKnot(r).traced);
    expect(cut.length).toBeGreaterThan(1);
    for (const shape of cut) {
      expect(shape.d.endsWith("Z")).toBe(true);
      expect(shape.fill).toBe("#000000");
      expect(shape.stroke).toBeUndefined();
    }
    expect(selfCrossings(edges(cut.flatMap((s) => polylines(s.d)), true))).toBe(0);
  });

  it.each(layouts)("with interlace off, the merged outline is closed and never crosses: %o", (patch) => {
    const r: CelticKnotRequest = { ...req, ...patch, ribbon: 80, interlace: "off" };
    const { cut } = drawKnot(r, traceKnot(r).traced);
    expect(cut).toHaveLength(1);
    expect(cut[0].d.match(/M/g)!.length).toBe(cut[0].d.match(/Z/g)!.length);
    expect(selfCrossings(edges(polylines(cut[0].d), true))).toBe(0);
  });

  it("cuts one piece per under-crossing, plus one per plain ring", () => {
    const result = generateCelticKnot(req);
    const rings = result.strandList.filter((s) => s.crossings === 0).length;
    expect(result.pieces).toBe(result.crossings + rings);
    expect(result.strands).toBe(result.strandList.length);
  });

  it("leaves a stencil of open lines with gaps, and a coloring page of closed outlines", () => {
    const { traced } = traceKnot({ ...req, pattern: "none" });
    const drawing = drawKnot({ ...req, pattern: "none" }, traced);
    expect(drawing.stencil.every((s) => !s.fill && !s.d.endsWith("Z"))).toBe(true);
    expect(drawing.coloring.slice(1).every((s) => s.fill === "#ffffff" && s.stroke === "#000000" && s.d.endsWith("Z"))).toBe(true);
  });

  it("colors strands in turn, or all alike", () => {
    const result = generateCelticKnot({ ...req, cols: 6, rows: 6, pattern: "none" });
    expect(result.strandList.map((s) => s.color)).toEqual(["#111111", "#222222", "#333333", "#111111", "#222222", "#333333"]);
    expect(new Set(generateCelticKnot({ ...req, cols: 6, rows: 6, pattern: "none", perStrand: false }).strandList.map((s) => s.color))).toEqual(new Set(["#111111"]));
  });

  it("has an honest size and viewBox for downloads", () => {
    for (const svg of Object.values(generateCelticKnot(req).svg)) {
      expect(svg).toMatch(/viewBox="0 0 [\d.]+ [\d.]+"/);
      expect(svg).toContain('width="8in"');
      expect(svg).toContain('height="5.5');
    }
  });

  it("changes the gap with the interlace style", () => {
    expect(generateCelticKnot({ ...req, interlace: "open" }).svg.cut).not.toBe(generateCelticKnot({ ...req, interlace: "tight" }).svg.cut);
    expect(generateCelticKnot({ ...req, interlace: "off" }).pieces).toBe(1);
  });
});

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("round trips the %s default as an empty query", (locale) => {
    const state = defaultCelticKnotState(locale);
    expect(serializeCelticKnotState(state)).toBe("");
    expect(parseCelticKnotState(params(""), locale)).toEqual(state);
  });

  it("round trips changed settings", () => {
    const state: CelticKnotRequest = { ...defaultCelticKnotState("de"), cols: 9, rows: 3, pattern: "random", seed: 12, density: 40, ribbon: 80, interlace: "off", perStrand: false, size: 12, colors: ["#abcdef"], background: "#010203", outline: "#040506" };
    const query = serializeCelticKnotState(state);
    expect(parseCelticKnotState(params(query), "de")).toEqual(state);
    expect(generateCelticKnot(parseCelticKnotState(params(query), "de"))).toEqual(generateCelticKnot(state));
  });

  it("falls back to defaults on bad input", () => {
    const bad = "c=99&r=-1&p=evil&seed=1e9&d=33&w=abc&i=<x>&in=0&k=zzz-000000&bg=red&ol=%22%3E";
    const parsed = parseCelticKnotState(params(bad));
    expect(parsed).toEqual(defaultCelticKnotState());
    expect(parseCelticKnotState(params("seed=-5")).seed).toBe(defaultCelticKnotState().seed);
    expect(parseCelticKnotState(params("k=000000-000000-000000-000000-000000-000000-000000")).colors).toEqual(defaultCelticKnotState().colors);
  });

  it("offers the engine's patterns exactly", () => {
    expect(PATTERN_OPTIONS).toEqual([...BREAK_PATTERNS]);
  });

  it.each(LOCALES)("varies the %s default colors, and its design has several strands", (locale) => {
    const state = defaultCelticKnotState(locale);
    expect(generateCelticKnot(state).strands).toBeGreaterThan(1);
    if (locale !== "en") expect(state.colors).not.toEqual(defaultCelticKnotState("en").colors);
  });
});

describe("translation", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  /** Every string in a nested object, by its dotted path. */
  const flat = (value: object, prefix = ""): Record<string, string> =>
    Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));

  describe.each([["engine", engineText], ["site", uiText]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
      const english = flat(catalog.en);
      const text = flat(catalog[locale]);
      expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
      for (const [name, value] of Object.entries(english)) {
        expect(text[name], name).toBeTruthy();
        expect(placeholders(text[name]), name).toEqual(placeholders(value));
      }
    });
  });

  it("names every pattern and interlace style", () => {
    for (const pattern of BREAK_PATTERNS) expect(uiText.en.patterns[pattern]).toBeTruthy();
  });

  it.each(LOCALES)("leaves no placeholder unfilled in %s", (locale) => {
    const result = generateCelticKnot({ ...req, locale });
    expect(JSON.stringify(result.steps)).not.toMatch(/\{\w+\}/);
    expect(result.steps).toHaveLength(4);
  });
});

describe("PDF", () => {
  it.each(LOCALES)("builds in %s", async (locale) => {
    for (const interlace of ["open", "off"] as const) {
      const doc = await PDFDocument.load(await generateCelticKnotPdf({ ...defaultCelticKnotState(locale), interlace }));
      expect(doc.getPageCount()).toBe(4);
    }
  });

  it("fits an awkward wide grid", async () => {
    const doc = await PDFDocument.load(await generateCelticKnotPdf({ ...req, cols: 16, rows: 2 }));
    expect(doc.getPageCount()).toBe(4);
  });
});
