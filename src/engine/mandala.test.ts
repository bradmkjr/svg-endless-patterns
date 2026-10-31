import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import uiText from "../i18n/messages/mandala.json";
import { defaultMandalaState, LINE_OPTIONS, moveRing, MOTIF_OPTIONS, parseMandalaState, RING_OPTIONS, serializeMandalaState, SIZE_OPTIONS, SYMMETRY_OPTIONS } from "../lib/mandalaState";
import { LOCALES } from "./i18n";
import { CANVAS, generateMandala, mandalaMotifThumb, MOTIFS, type MandalaRequest, type MandalaRingSpec } from "./mandala";
import { generateMandalaPdf } from "./mandalaPdf";
import engineText from "./messages/mandala.json";

const req: MandalaRequest = { symmetry: 8, rings: 5, motifs: [...MOTIFS], seed: 7, lineWeight: 3, colors: ["#111111", "#222222", "#333333"], background: "#eeeeee", outline: "#000011" };

/** A shape read back from the SVG: its paint, and every coordinate it uses. */
type Drawn = { paint: string; points: [number, number][]; r: number; strokeWidth: number };

function readShapes(svg: string): Drawn[] {
  const paint = (fill: string, stroke: string, width: string) => `${fill}/${stroke}/${width}`;
  const circles = [...svg.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)" fill="(#\w+)" stroke="(#\w+)" stroke-width="([\d.]+)"\/>/g)].map(
    (m): Drawn => ({ paint: paint(m[4], m[5], m[6]), points: [[Number(m[1]), Number(m[2])]], r: Number(m[3]), strokeWidth: Number(m[6]) }),
  );
  const paths = [...svg.matchAll(/<path d="([^"]+)" fill="(#\w+)" stroke="(#\w+)" stroke-width="([\d.]+)"\/>/g)].map((m): Drawn => {
    // Only M, L, C and Z are used, all absolute, so the numbers are plain x y pairs.
    const numbers = m[1].replace(/[MLCZ]/g, " ").trim().split(/\s+/).map(Number);
    const points = Array.from({ length: numbers.length / 2 }, (_, i): [number, number] => [numbers[i * 2], numbers[i * 2 + 1]]);
    return { paint: paint(m[2], m[3], m[4]), points, r: 0, strokeWidth: Number(m[4]) };
  });
  const shapes = [...circles, ...paths];
  // Nothing may slip past the parsers and go untested.
  expect(shapes).toHaveLength((svg.match(/<(circle|path) /g) ?? []).length);
  return shapes;
}

/** Rotating the whole set about the center by this angle gives the same set of shapes. */
function mapsToItself(shapes: Drawn[], degrees: number): boolean {
  const angle = (degrees * Math.PI) / 180;
  const c = CANVAS / 2;
  const unused = [...shapes];
  // Coordinates are rounded to 0.01, so a rotated point can differ by a little more than that.
  const close = (a: number, b: number) => Math.abs(a - b) < 0.03;
  for (const shape of shapes) {
    const rotated = shape.points.map(([x, y]) => [c + (x - c) * Math.cos(angle) - (y - c) * Math.sin(angle), c + (x - c) * Math.sin(angle) + (y - c) * Math.cos(angle)]);
    const match = unused.findIndex((o) => o.paint === shape.paint && o.r === shape.r && o.points.length === rotated.length && o.points.every(([x, y], i) => close(x, rotated[i][0]) && close(y, rotated[i][1])));
    if (match < 0) return false;
    unused.splice(match, 1);
  }
  return true;
}

const SYMMETRIES = [6, 7, 8, 9, 10, 12, 13, 16, 18, 20, 24];
const SEEDS = [0, 1, 7, 42, 2718, 999999];

describe("symmetry", () => {
  it.each(SYMMETRIES)("has exactly %i-fold rotational symmetry at every seed", (symmetry) => {
    for (const seed of SEEDS) {
      const shapes = readShapes(generateMandala({ ...req, symmetry, seed }).svg.art);
      expect(mapsToItself(shapes, 360 / symmetry), `seed ${seed}`).toBe(true);
      // Any higher order would include one of these prime multiples.
      for (const p of [2, 3, 5, 7]) expect(mapsToItself(shapes, 360 / (symmetry * p)), `seed ${seed} x${p}`).toBe(false);
    }
  });

  it.each(MOTIFS)("holds for a design of only %s", (motif) => {
    for (const symmetry of [6, 11, 24]) {
      const shapes = readShapes(generateMandala({ ...req, symmetry, motifs: [motif], rings: 8 }).svg.art);
      expect(mapsToItself(shapes, 360 / symmetry)).toBe(true);
      expect(mapsToItself(shapes, 180 / symmetry)).toBe(false);
    }
  });

  it("repeats every ring a whole number of times per fold", () => {
    for (const seed of SEEDS) {
      const { rings } = generateMandala({ ...req, seed, rings: 8 });
      expect(rings[0].copies).toBe(req.symmetry);
      for (const ring of rings) expect(ring.copies % req.symmetry).toBe(0);
    }
  });

  it("detects a broken design", () => {
    const shapes = readShapes(generateMandala(req).svg.art);
    const moved = shapes.map((s, i) => (i === shapes.length - 2 ? { ...s, points: s.points.map(([x, y]): [number, number] => [x + 1, y]) } : s));
    expect(mapsToItself(moved, 360 / req.symmetry)).toBe(false);
  });
});

describe("canvas", () => {
  it("keeps every shape and its line inside", () => {
    for (const symmetry of [6, 15, 24]) {
      for (const rings of RING_OPTIONS) {
        for (const seed of SEEDS) {
          for (const svg of Object.values(generateMandala({ ...req, symmetry, rings, seed, lineWeight: Math.max(...LINE_OPTIONS) }).svg)) {
            for (const shape of readShapes(svg)) {
              // A curve stays inside its control points, so checking those is enough.
              const reach = shape.r + shape.strokeWidth / 2;
              for (const [x, y] of shape.points) {
                expect(x - reach).toBeGreaterThanOrEqual(0);
                expect(y - reach).toBeGreaterThanOrEqual(0);
                expect(x + reach).toBeLessThanOrEqual(CANVAS);
                expect(y + reach).toBeLessThanOrEqual(CANVAS);
              }
            }
          }
        }
      }
    }
  });

  it("draws the rings asked for from the motifs allowed", () => {
    const { rings } = generateMandala({ ...req, rings: 8, motifs: ["dots", "arcs"] });
    expect(rings).toHaveLength(8);
    expect(new Set(rings.map((r) => r.motif))).toEqual(new Set(["dots", "arcs"]));
  });

  it("falls back to every motif when none is allowed", () => {
    expect(generateMandala({ ...req, motifs: [] }).rings).toHaveLength(req.rings);
  });
});

describe("rings chosen by hand", () => {
  const plan: MandalaRingSpec[] = MOTIFS.map((motif, i) => ({ motif, repeat: 1 + (i % 4), size: 60 + i * 5, color: i, band: i % 3 ? null : i + 1, accent: i % 2 === 0, offset: i % 2 === 1 }));

  it("draws exactly the rings asked for, in order", () => {
    const { rings } = generateMandala({ ...req, ringPlan: plan });
    expect(rings.map((r) => r.motif)).toEqual([...MOTIFS]);
    expect(rings.map((r) => r.copies)).toEqual(plan.map((r, i) => req.symmetry * (i === 0 ? 1 : r.repeat)));
  });

  it("wraps color choices to fit the palette", () => {
    const { rings } = generateMandala({ ...req, ringPlan: plan });
    rings.forEach((ring, i) => expect(ring.color).toBe(req.colors[i % req.colors.length]));
  });

  it("ignores the seed", () => {
    expect(generateMandala({ ...req, ringPlan: plan, seed: 1 }).svg.art).toBe(generateMandala({ ...req, ringPlan: plan, seed: 2 }).svg.art);
  });

  it.each([6, 11, 24])("keeps %i-fold symmetry and stays on the canvas", (symmetry) => {
    const shapes = readShapes(generateMandala({ ...req, symmetry, ringPlan: plan, lineWeight: 8 }).svg.art);
    expect(mapsToItself(shapes, 360 / symmetry)).toBe(true);
    for (const shape of shapes) for (const [x, y] of shape.points) expect(Math.min(x, y) - shape.r).toBeGreaterThanOrEqual(0);
    for (const shape of shapes) for (const [x, y] of shape.points) expect(Math.max(x, y) + shape.r).toBeLessThanOrEqual(CANVAS);
  });

  it("turns a ring half a copy", () => {
    const flat = plan.map((ring) => ({ ...ring, offset: false }));
    expect(generateMandala({ ...req, ringPlan: flat }).svg.art).not.toBe(generateMandala({ ...req, ringPlan: plan }).svg.art);
  });

  it("gives a seeded design's own rings back, so it can be edited from there", () => {
    const seeded = generateMandala({ ...req, rings: 8, seed: 42 });
    const pinned = generateMandala({ ...req, ringPlan: seeded.rings.map((ring) => ring.spec) });
    expect(pinned.rings.map(({ motif, copies, color }) => ({ motif, copies, color }))).toEqual(seeded.rings.map(({ motif, copies, color }) => ({ motif, copies, color })));
  });

  it("builds a PDF", async () => {
    const doc = await PDFDocument.load(await generateMandalaPdf({ ...req, ringPlan: plan }));
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("older links", () => {
  it("keeps a seed's design, unchanged by the new motifs", () => {
    const { motifs } = parseMandalaState(new URLSearchParams("seed=7"));
    expect(motifs).toEqual(["petals", "arcs", "dots", "scallops", "diamonds", "triangles"]);
  });
});

describe("seed", () => {
  it("gives identical output for the same seed", () => {
    expect(generateMandala(req)).toEqual(generateMandala({ ...req }));
  });

  it("gives different output for different seeds", () => {
    const designs = new Set(Array.from({ length: 50 }, (_, seed) => generateMandala({ ...req, seed }).svg.art));
    expect(designs.size).toBe(50);
    expect(generateMandala({ ...req, motifs: ["dots"], colors: ["#111111"], seed: 1 }).svg.art).not.toBe(generateMandala({ ...req, motifs: ["dots"], colors: ["#111111"], seed: 2 }).svg.art);
  });

  it("doesn't change the geometry for a line or language change", () => {
    const geometry = (svg: string) => svg.replace(/<title>.*<\/title>/, "").replace(/stroke-width="[\d.]+"/g, "");
    const base = geometry(generateMandala(req).svg.art);
    expect(geometry(generateMandala({ ...req, lineWeight: 8 }).svg.art)).toBe(base);
    for (const locale of LOCALES) expect(geometry(generateMandala({ ...req, locale }).svg.art)).toBe(base);
  });
});

describe("coloring page", () => {
  it("has black lines on white and no color", () => {
    const { art, coloring } = generateMandala(req).svg;
    expect(coloring.match(/<rect[^>]*>/)![0]).toContain('fill="#ffffff"');
    expect([...new Set([...coloring.matchAll(/ fill="([^"]+)"/g)].map((m) => m[1]))]).toEqual(["#ffffff"]);
    expect([...new Set([...coloring.matchAll(/ stroke="([^"]+)"/g)].map((m) => m[1]))]).toEqual(["#000000"]);
    for (const color of [...req.colors, req.background, req.outline]) expect(coloring).not.toContain(color);
    // The colored version does use them, and both have the same shapes.
    for (const color of [req.background, req.outline]) expect(art).toContain(color);
    expect(readShapes(coloring).map((s) => s.points)).toEqual(readShapes(art).map((s) => s.points));
  });
});

describe("share links", () => {
  const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseMandalaState(new URLSearchParams(query), locale);

  it.each(LOCALES)("has an empty link for the %s defaults", (locale) => {
    expect(serializeMandalaState(defaultMandalaState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultMandalaState(locale));
  });

  it("round trips a ring plan", () => {
    const ringPlan: MandalaRingSpec[] = [
      { motif: "lotus", repeat: 1, size: 96, color: 2, band: null, accent: true, offset: false },
      { motif: "hearts", repeat: 16, size: 200, color: 0, band: 3, accent: false, offset: true },
    ];
    const state: MandalaRequest = { ...defaultMandalaState(), ringPlan };
    expect(parse(serializeMandalaState(state))).toEqual(state);
  });

  it.each(["rs=lotus", "rs=stars9.1.100.0.x.0.0", "rs=lotus.99.100.0.x.0.0", "rs=lotus.1.10.0.x.0.0", "rs=lotus.1.100.9.x.0.0", "rs=lotus.1.100.0.9.0.0", "rs=lotus.1.100.0.x.2.0", "rs=lotus.1.100.0.x.0.0.0", "rs=%3Cscript%3E"])("uses the default rings for the bad plan %s", (query) => {
    expect(parse(query).ringPlan).toEqual(defaultMandalaState().ringPlan);
  });

  it("tells seeded links from ring plans", () => {
    expect(parse("seed=5").ringPlan).toBeUndefined();
    expect(parse("r=4").ringPlan).toBeUndefined();
    expect(parse("n=8").ringPlan).toEqual(defaultMandalaState().ringPlan);
    const seeded = { ...defaultMandalaState(), ringPlan: undefined };
    expect({ ringPlan: undefined, ...parse(serializeMandalaState(seeded)) }).toEqual(seeded);
  });

  it("offers only rings the plan encoding accepts", () => {
    for (const size of SIZE_OPTIONS) expect(parse(`rs=lotus.1.${size}.0.x.0.0`).ringPlan![0].size).toBe(size);
  });

  it("round trips every setting", () => {
    const state: MandalaRequest = { symmetry: 17, rings: 3, motifs: ["arcs", "diamonds"], seed: 4321, lineWeight: 6, colors: ["#123456", "#abcdef"], background: "#101010", outline: "#fedcba" };
    expect(parse(serializeMandalaState(state))).toEqual(state);
    expect(parse(serializeMandalaState({ ...state, locale: "de" }), "de")).toEqual({ ...state, locale: "de" });
  });

  it.each(["n=8&m=petals.dots&seed=7", "n=16&r=7&seed=314", "n=24&r=4&m=scallops.diamonds&seed=2718"])("%s survives a round trip", (query) => {
    expect(serializeMandalaState(parse(query))).toBe(query);
  });

  it.each([
    ["n=5", "symmetry"],
    ["n=25", "symmetry"],
    ["n=abc", "symmetry"],
    ["n=8.5", "symmetry"],
    ["r=1", "rings"],
    ["r=99", "rings"],
    ["m=petals.comets", "motifs"],
    ["m=", "motifs"],
    ["seed=-1", "seed"],
    ["seed=1234567", "seed"],
    ["seed=abc", "seed"],
    ["w=5", "lineWeight"],
    ["k=zzzzzz", "colors"],
    ["k=123456-12", "colors"],
    ["k=111111-222222-333333-444444-555555-666666-777777", "colors"],
    ["bg=red", "background"],
    ["ol=%22/%3E", "outline"],
  ] as const)("ignores the bad value %s", (query, field) => {
    expect(parse(query)[field]).toEqual(defaultMandalaState()[field]);
  });

  it("gives each language its own colors", () => {
    const looks = LOCALES.map((locale) => defaultMandalaState(locale).colors.join());
    expect(new Set(looks).size).toBe(LOCALES.length);
  });

  it("offers what the engine draws", () => {
    expect(MOTIF_OPTIONS).toEqual([...MOTIFS]);
    expect(SYMMETRY_OPTIONS[0]).toBe(6);
    expect(SYMMETRY_OPTIONS.at(-1)).toBe(24);
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

  it.each(LOCALES)("PDF text in %s fits Helvetica's character set", (locale) => {
    for (const value of Object.values(engineText[locale])) expect(value).toMatch(/^[\x20-\x7e -ÿ]*$/);
  });

  it("moves a ring", () => {
    const plan = defaultMandalaState().ringPlan!;
    const moved = moveRing(plan, 0, 2);
    expect(moved[2]).toBe(plan[0]);
    expect(moved).toHaveLength(plan.length);
  });

  it("has a picture of every motif", () => {
    for (const motif of MOTIFS) expect(mandalaMotifThumb(motif)).toContain("<svg");
  });

  it("names every motif", () => {
    for (const motif of MOTIFS) expect(uiText.en.motifNames[motif]).toBeTruthy();
  });
});

describe("PDF", () => {
  it.each(LOCALES)("builds a colored page and a coloring page in %s", async (locale) => {
    const doc = await PDFDocument.load(await generateMandalaPdf(defaultMandalaState(locale)));
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getTitle()).toBe(engineText[locale].pdfTitle);
  });

  it("builds at the largest settings", async () => {
    const doc = await PDFDocument.load(await generateMandalaPdf({ ...req, symmetry: 24, rings: 8, lineWeight: 8 }));
    expect(doc.getPageCount()).toBe(2);
  });
});
