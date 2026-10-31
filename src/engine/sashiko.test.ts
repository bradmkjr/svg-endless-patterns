import { describe, expect, it } from "vitest";
import { decodePDFRawStream, PDFArray, PDFDocument, PDFRawStream, StandardFonts, type PDFPage } from "pdf-lib";
import uiCopy from "../i18n/messages/sashiko.json";
import { defaultSashikoState, MOTIF_OPTIONS, parseSashikoState, serializeSashikoState } from "../lib/sashikoState";
import engineCopy from "./messages/sashiko.json";
import { generateSashiko, motifTile, pointAt, SASHIKO_MOTIFS, sashikoRuns, sashikoSheets, stitchesOn, strokeLength, type SashikoRequest, type SashikoRun, type Stroke } from "./sashiko";
import { CHECK_X, CHECK_Y, generateSashikoPdf, sheetPoint } from "./sashikoPdf";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const req: SashikoRequest = { motif: "asanoha", spacing: 2, stitch: 0.125, width: 12, height: 12, cloth: "#1f2a44", thread: "#f4f1e8" };
const key = (x: number, y: number) => `${x.toFixed(3)},${y.toFixed(3)}`;
const ends = (s: Stroke) => [pointAt(s, 0), pointAt(s, 1)];
const samples = (s: Stroke, parts = 6) => Array.from({ length: parts + 1 }, (_, i) => pointAt(s, i / parts));

/** Line ends on the panel, with how many lines meet at each. Near the edges, lines are cut off. */
function nodes(runs: SashikoRun[]) {
  const found = new Map<string, { x: number; y: number; degree: number }>();
  for (const run of runs) {
    for (const [x, y] of ends(run.stroke)) {
      const k = key(x, y);
      const node = found.get(k) ?? { x, y, degree: 0 };
      node.degree++;
      found.set(k, node);
    }
  }
  return [...found.values()];
}

/** Proper crossing of two straight pieces, ignoring ends that merely touch. */
function piecesCross(a: number[][], b: number[][]): boolean {
  const side = (p: number[], q: number[], r: number[]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  for (let i = 1; i < a.length; i++) {
    for (let j = 1; j < b.length; j++) {
      const d1 = side(a[i - 1], a[i], b[j - 1]);
      const d2 = side(a[i - 1], a[i], b[j]);
      const d3 = side(b[j - 1], b[j], a[i - 1]);
      const d4 = side(b[j - 1], b[j], a[i]);
      if (d1 * d2 < 0 && d3 * d4 < 0) return true;
    }
  }
  return false;
}

describe.each(SASHIKO_MOTIFS)("%s", (motif) => {
  const spacing = 2;
  const runs = sashikoRuns({ ...req, motif, spacing, stitch: 0.125, width: 16, height: 16 });

  it("repeats seamlessly, lines and stitches alike", () => {
    const { width: tileW, height: tileH } = motifTile(motif, spacing);
    const margin = 2 * spacing;
    const inner = (x: number, y: number) => x > margin && y > margin && x < 16 - margin && y < 16 - margin;
    const allPoints = new Set(runs.flatMap((run) => run.dashes.flatMap((d) => ends(d).map(([x, y]) => key(x, y)))));
    let checked = 0;
    for (const [dx, dy] of [[tileW, 0], [0, tileH]]) {
      for (const run of runs) {
        for (const dash of run.dashes) {
          for (const [x, y] of ends(dash)) {
            if (!inner(x, y) || !inner(x + dx, y + dy)) continue;
            expect(allPoints.has(key(x + dx, y + dy)), key(x, y)).toBe(true);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("stays within the panel", () => {
    expect(runs.length).toBeGreaterThan(0);
    for (const run of runs) {
      for (const dash of run.dashes) {
        for (const [x, y] of samples(dash)) {
          expect(x).toBeGreaterThanOrEqual(-1e-6);
          expect(y).toBeGreaterThanOrEqual(-1e-6);
          expect(x).toBeLessThanOrEqual(16 + 1e-6);
          expect(y).toBeLessThanOrEqual(16 + 1e-6);
        }
      }
    }
  });

  it("has no line drawn twice", () => {
    const seen = runs.map((run) => key(...pointAt(run.stroke, 0.5)));
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("leaves half a gap at both ends of every line, with stitches evenly placed", () => {
    for (const run of runs) {
      const lengths = run.dashes.map(strokeLength);
      const gapEach = (run.length - lengths.reduce((a, b) => a + b, 0)) / run.dashes.length;
      expect(gapEach).toBeGreaterThan(0);
      const first = Math.hypot(pointAt(run.dashes[0], 0)[0] - pointAt(run.stroke, 0)[0], pointAt(run.dashes[0], 0)[1] - pointAt(run.stroke, 0)[1]);
      const last = run.dashes[run.dashes.length - 1];
      const lastEnd = Math.hypot(pointAt(last, 1)[0] - pointAt(run.stroke, 1)[0], pointAt(last, 1)[1] - pointAt(run.stroke, 1)[1]);
      // Measured across the chord, which on an arc is a hair shorter than along it.
      expect(first).toBeCloseTo(gapEach / 2, 2);
      expect(lastEnd).toBeCloseTo(gapEach / 2, 2);
    }
  });

  it("no stitch crosses another, or reaches a node", () => {
    // Small panel: this compares every pair of stitches, without using the engine's own line cutting.
    const small = sashikoRuns({ ...req, motif, spacing, width: 6, height: 6 });
    const dashes = small.flatMap((run) => run.dashes.map((d) => samples(d))).map((points) => {
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      return { points, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
    for (let i = 0; i < dashes.length; i++) {
      const a = dashes[i];
      for (let j = i + 1; j < dashes.length; j++) {
        const b = dashes[j];
        if (a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0) continue;
        expect(piecesCross(a.points, b.points)).toBe(false);
      }
    }
    for (const node of nodes(small)) {
      for (const dash of dashes) {
        if (node.x < dash.x0 - 0.1 || node.x > dash.x1 + 0.1 || node.y < dash.y0 - 0.1 || node.y > dash.y1 + 0.1) continue;
        for (const [x, y] of dash.points) expect(Math.hypot(x - node.x, y - node.y)).toBeGreaterThan(0.015);
      }
    }
  }, 30000);
});

describe("motif geometry", () => {
  const expected: Record<(typeof SASHIKO_MOTIFS)[number], number[]> = {
    squares: [4],
    diamonds: [4],
    kikko: [3],
    asanoha: [3, 12],
    kagome: [4],
    shippo: [8],
    seigaiha: [3],
  };

  it.each(SASHIKO_MOTIFS)("%s meets at the right number of lines at every inner node", (motif) => {
    const runs = sashikoRuns({ ...req, motif, width: 20, height: 20 });
    const inner = nodes(runs).filter((n) => n.x > 3 && n.y > 3 && n.x < 17 && n.y < 17);
    expect(inner.length).toBeGreaterThan(5);
    expect([...new Set(inner.map((n) => n.degree))].sort((a, b) => a - b)).toEqual(expected[motif]);
  });

  it("draws regular shapes at the stated spacing", () => {
    // A kikko hexagon has six equal sides, and two flat sides a spacing apart.
    const kikko = motifTile("kikko", 2).strokes.map(strokeLength);
    for (const length of kikko) expect(length).toBeCloseTo(2 / Math.sqrt(3), 6);
    const verticals = motifTile("kikko", 2).strokes.filter((s) => s.kind === "line" && s.x1 === s.x2) as Extract<Stroke, { kind: "line" }>[];
    expect(Math.abs(verticals[0].x1 - verticals[1].x1)).toBeCloseTo(1, 6);
    // Asanoha: each inner line runs from a triangle's center to a corner, side / sqrt(3).
    const asanoha = sashikoRuns({ ...req, width: 12, height: 12 }).map((r) => r.length);
    expect(asanoha.some((l) => Math.abs(l - 2) < 1e-6)).toBe(true);
    expect(asanoha.some((l) => Math.abs(l - 2 / Math.sqrt(3)) < 1e-6)).toBe(true);
    // Kagome cuts into equal triangle sides.
    const kagome = sashikoRuns({ ...req, motif: "kagome", width: 12, height: 12 }).filter((r) => [...ends(r.stroke)].every(([x, y]) => x > 0.01 && y > 0.01 && x < 11.99 && y < 11.99));
    for (const run of kagome) expect(run.length).toBeCloseTo(2, 6);
    // Shippo: quarter circles.
    const shippo = sashikoRuns({ ...req, motif: "shippo", width: 12, height: 12 }).filter((r) => r.stroke.kind === "arc" && r.stroke.a1 - r.stroke.a0 > 1.57);
    for (const run of shippo) expect(run.length).toBeCloseTo((Math.PI / 2) * 1, 6);
  });

  it("centers the motif so opposite edges match", () => {
    const points = sashikoRuns(req).flatMap((run) => ends(run.stroke));
    const keys = new Set(points.map(([x, y]) => key(x, y)));
    for (const [x, y] of points) expect(keys.has(key(12 - x, y)), key(x, y)).toBe(true);
  });
});

describe("stitches", () => {
  it("come close to the asked length when a line has room", () => {
    for (const stitch of [0.125, 0.1875, 0.25]) {
      for (const run of sashikoRuns({ ...req, stitch })) {
        if (run.length < 2 * stitch * (5 / 3)) continue;
        for (const dash of run.dashes) {
          expect(strokeLength(dash)).toBeGreaterThan(stitch * 0.74);
          expect(strokeLength(dash)).toBeLessThan(stitch * 1.26);
        }
      }
    }
  });

  it("center on a one-stitch line, and keep a gap", () => {
    const dashes = stitchesOn({ kind: "line", x1: 0, y1: 0, x2: 1, y2: 0 }, 1);
    expect(dashes).toHaveLength(1);
    const [[x0], [x1]] = ends(dashes[0]);
    expect((x0 + x1) / 2).toBeCloseTo(0.5, 9);
    expect(x0).toBeGreaterThan(0);
  });

  it("flag motifs too fine for the stitch", () => {
    expect(generateSashiko({ ...req, motif: "seigaiha", spacing: 0.75, stitch: 0.25 }).tight).toBe(true);
    expect(generateSashiko(req).tight).toBe(false);
  });
});

describe("panel output", () => {
  it("sizes the SVG at true scale, in the chosen colors", () => {
    const { svg, stitches, width, height } = generateSashiko({ ...req, width: 10, height: 14 });
    expect(svg.panel).toContain('viewBox="0 0 10 14"');
    expect(svg.panel).toContain('width="10in" height="14in"');
    expect(svg.panel).toContain('fill="#1f2a44"');
    expect(svg.panel).toContain('stroke="#f4f1e8"');
    expect(svg.panel.match(/M/g)?.length).toBe(stitches);
    expect([width, height]).toEqual(["10", "14"]);
  });

  it("has a plain JSON result", () => {
    const result = generateSashiko(req);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe("sheets", () => {
  it("uses one sheet when the panel fits", () => {
    expect(sashikoSheets(7, 8)).toHaveLength(1);
    expect(sashikoSheets(7.5, 8.5)[0]).toMatchObject({ width: 7.5, height: 8.5 });
  });

  it.each([[12, 12], [8, 8.5], [7.5, 20], [36, 36], [24, 10]])("covers a %f x %f panel with overlap", (width, height) => {
    const sheets = sashikoSheets(width, height);
    const covered = (x: number, y: number) => sheets.some((s) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height);
    for (let x = 0; x <= width; x += 0.1) for (let y = 0; y <= height; y += 0.1) expect(covered(x, y), key(x, y)).toBe(true);
    for (const s of sheets) {
      expect(s.width).toBeLessThanOrEqual(7.5);
      expect(s.height).toBeLessThanOrEqual(8.5);
      expect(s.x + s.width).toBeLessThanOrEqual(width);
      expect(s.y + s.height).toBeLessThanOrEqual(height);
    }
    // Neighbors share half an inch, so sheets can be lined up.
    for (const a of sheets) {
      const right = sheets.find((s) => s.col === a.col + 1 && s.row === a.row);
      if (right) expect(a.x + a.width - right.x).toBeCloseTo(0.5, 9);
      const below = sheets.find((s) => s.col === a.col && s.row === a.row + 1);
      if (below) expect(a.y + a.height - below.y).toBeCloseTo(0.5, 9);
    }
  });
});

/** A page's drawing commands, read back from the saved file. */
function content(page: PDFPage): string {
  const contents = page.node.Contents();
  const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => page.doc.context.lookup(ref)) : [contents];
  return streams.map((s) => new TextDecoder("latin1").decode(decodePDFRawStream(s as PDFRawStream).decode())).join("\n");
}

/** Straight segments stroked on a page, as `x y m x y l S`. */
function segments(text: string): number[][] {
  const number = "(-?[\\d.]+)";
  const found = text.matchAll(new RegExp(`${number} ${number} m\\s+${number} ${number} l\\s+S`, "g"));
  return [...found].map((m) => m.slice(1, 5).map(Number));
}

describe("PDF", () => {
  it("is letter size and draws the check square at exactly 1 inch", async () => {
    const doc = await PDFDocument.load(await generateSashikoPdf(req));
    for (const page of doc.getPages().slice(1)) {
      expect(page.getSize()).toEqual({ width: 612, height: 792 });
      const text = content(page);
      const square = new RegExp(`${CHECK_X} ${CHECK_Y} m\\s+${CHECK_X + 72} ${CHECK_Y} l\\s+${CHECK_X + 72} ${CHECK_Y + 72} l\\s+${CHECK_X} ${CHECK_Y + 72} l`);
      expect(text).toMatch(square);
    }
  });

  it("prints the panel at true scale: stitches, spacing and total size", async () => {
    // A 6" square panel, one sheet: square grid lines 1" apart, in page points.
    const request = { ...req, motif: "squares" as const, spacing: 1, stitch: 0.25, width: 6, height: 6 };
    const doc = await PDFDocument.load(await generateSashikoPdf(request));
    expect(doc.getPageCount()).toBe(2);
    const stitches = segments(content(doc.getPages()[1])).filter(([x1, y1, x2, y2]) => y1 === y2 && x1 !== x2 && Math.abs(x2 - x1) < 40);
    const levels = [...new Set(stitches.map((s) => s[1]))].sort((a, b) => b - a);
    expect(levels).toHaveLength(5);
    for (let i = 1; i < levels.length; i++) expect(levels[i - 1] - levels[i]).toBeCloseTo(72, 5);
    // 1" line, four 1/4" stitch-and-gap units would be 5/12" each: rounds to two, at 3/5 of 1/2".
    expect(Math.abs(stitches[0][2] - stitches[0][0])).toBeCloseTo(0.3 * 72, 3);
    const xs = stitches.flatMap((s) => [s[0], s[2]]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(6 * 72);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(5.8 * 72);
  });

  it("shows every stitch on some sheet, at its place on the panel, when tiled", async () => {
    const request = { ...req, motif: "squares" as const, spacing: 1, width: 16, height: 20 };
    const sheets = sashikoSheets(16, 20);
    expect(sheets.length).toBeGreaterThan(4);
    const doc = await PDFDocument.load(await generateSashikoPdf(request));
    expect(doc.getPageCount()).toBe(sheets.length + 1);

    const drawn = new Set<string>();
    sheets.forEach((sheet, i) => {
      const [originX, originY] = sheetPoint(sheet, 0, 0);
      for (const [x1, y1, x2, y2] of segments(content(doc.getPages()[i + 1]))) {
        drawn.add(key((x1 - originX) / 72, (originY - y1) / 72) + "|" + key((x2 - originX) / 72, (originY - y2) / 72));
      }
    });
    const dashes = sashikoRuns(request).flatMap((run) => run.dashes);
    expect(dashes.length).toBeGreaterThan(500);
    for (const dash of dashes) {
      const [[x1, y1], [x2, y2]] = ends(dash);
      expect(drawn.has(`${key(x1, y1)}|${key(x2, y2)}`), key(x1, y1)).toBe(true);
    }
  });

  it("draws arcs as curves that stay on the circle", async () => {
    const doc = await PDFDocument.load(await generateSashikoPdf({ ...req, motif: "shippo", width: 6, height: 6 }));
    expect(content(doc.getPages()[1])).toMatch(/ c\s+S/);
  });

  it.each(LOCALES)("builds a %s guide, tiled, with every motif", async (locale) => {
    for (const motif of SASHIKO_MOTIFS) {
      const doc = await PDFDocument.load(await generateSashikoPdf({ ...defaultSashikoState(locale), motif, width: 10, height: 10 }));
      expect(doc.getPageCount()).toBe(1 + sashikoSheets(10, 10).length);
    }
    const result = generateSashiko({ ...defaultSashikoState(locale), width: 10 });
    expect(JSON.stringify(result.steps)).not.toMatch(/\{\w+\}/);
  });
});

describe("share links", () => {
  it("leaves defaults out", () => {
    for (const locale of LOCALES) expect(serializeSashikoState(defaultSashikoState(locale))).toBe("");
  });

  it("round-trips every setting", () => {
    const state: SashikoRequest = { motif: "seigaiha", spacing: 3, stitch: 0.1875, width: 18, height: 24, cloth: "#112233", thread: "#abcdef" };
    expect(parseSashikoState(new URLSearchParams(serializeSashikoState(state)))).toEqual(state);
    const pt = { ...state, locale: "pt" as const };
    expect(parseSashikoState(new URLSearchParams(serializeSashikoState(pt)), "pt")).toEqual(pt);
  });

  it("falls back on bad input", () => {
    const params = new URLSearchParams("m=nope&sp=9999&st=abc&w=-3&h=&c=zzz&t=%23000000");
    expect(parseSashikoState(params)).toEqual(defaultSashikoState());
    expect(parseSashikoState(params, "es")).toEqual(defaultSashikoState("es"));
  });

  it("gives each language its own default colors", () => {
    const colors = LOCALES.map((l) => defaultSashikoState(l).cloth);
    expect(new Set(colors).size).toBe(LOCALES.length);
  });

  it("offers exactly the engine's motifs", () => {
    expect([...MOTIF_OPTIONS].sort()).toEqual([...SASHIKO_MOTIFS].sort());
  });
});

describe("translations", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flatten = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => flatten(v, path ? `${path}.${k}` : k));

  describe.each([["engine", engineCopy], ["site", uiCopy]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has every key with the same placeholders", (locale) => {
      const english = flatten(catalog.en);
      const theirs = new Map(flatten(catalog[locale]));
      expect([...theirs.keys()].sort()).toEqual(english.map(([k]) => k).sort());
      for (const [k, text] of english) {
        expect(theirs.get(k), k).toBeTruthy();
        expect(placeholders(theirs.get(k)!), k).toEqual(placeholders(text));
      }
    });
  });

  it("covers every motif in both catalogs", () => {
    for (const locale of LOCALES) {
      for (const motif of SASHIKO_MOTIFS) {
        expect(engineCopy[locale][`motif_${motif}`]).toBeTruthy();
        expect(uiCopy[locale].motifs[motif]).toBeTruthy();
        expect(uiCopy[locale].spacingHelp[motif]).toBeTruthy();
      }
    }
  });

  it("keeps PDF text printable in Helvetica", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const locale of LOCALES) for (const [, text] of flatten(engineCopy[locale])) expect(() => font.encodeText(text)).not.toThrow();
  });
});
