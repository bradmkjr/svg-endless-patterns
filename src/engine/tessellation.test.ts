import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import siteText from "../i18n/messages/tessellation.json";
import { COUNT_OPTIONS, defaultTessellationState, GROUPS, MOTIFS as STATE_MOTIFS, parseTessellationState, REPEAT_OPTIONS, serializeTessellationState } from "../lib/tessellationState";
import type { Locale } from "./i18n";
import engineText from "./messages/tessellation.json";
import { fitMotif, generateTessellation, listTessellationOptions, MOTIF_IDS, MOTIFS, SVG_UNITS, tessellationPlacements, type TessellationMotif, type TessellationRequest } from "./tessellation";
import { generateTessellationPdf } from "./tessellationPdf";
import { applyAffine, compose, GROUP_IDS, isLatticeVector, translation, wallpaperGroup, type Affine, type GroupId, type Vec } from "./wallpaper";

const LOCALE_CODES: Locale[] = ["en", "es", "fr", "de", "pt"];
const colors = { background: "#ffffff", primary: "#112233", accent: "#cc3300" };
const request = (group: GroupId, motif: TessellationMotif = "leaf", extra: Partial<TessellationRequest> = {}): TessellationRequest => ({ motif, group, colors, repeatWidth: 4, across: 3, down: 2, outlines: false, ...extra });

/** Reads placements back out of the finished SVG, in lattice units, so the test checks what ships. */
function placementsInSvg(svg: string): Affine[] {
  return [...svg.matchAll(/<g transform="matrix\(([^)]+)\)">/g)].map((m) => {
    const [a, b, c, d, e, f] = m[1].split(" ").map(Number);
    return [a / SVG_UNITS, b / SVG_UNITS, c / SVG_UNITS, d / SVG_UNITS, e / SVG_UNITS, f / SVG_UNITS] as Affine;
  });
}

const inPolygon = (polygon: readonly Vec[], [x, y]: Vec) => {
  let odd = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
  }
  return odd;
};

/** The fill at a point of a drawn tile, painting shapes in order as the SVG does. */
function colorAt(motif: TessellationMotif, placed: Affine[], point: Vec): string {
  let found = "background";
  for (const m of placed) {
    for (const shape of MOTIFS[motif]) {
      if (inPolygon(shape.points.map((p) => applyAffine(m, p)), point)) found = shape.role;
    }
  }
  return found;
}

/** The fill at a point of the motif itself. */
function motifColorAt(motif: TessellationMotif, point: Vec): string {
  let found = "background";
  for (const shape of MOTIFS[motif]) if (inPolygon(shape.points, point)) found = shape.role;
  return found;
}

describe.each(GROUP_IDS)("%s", (id) => {
  const group = wallpaperGroup(id);
  const { width, height } = group.cell;

  // Every motif is checked against every group: the fit differs for each pair.
  describe.each(MOTIF_IDS)("%s", (motif) => {
    const placements = tessellationPlacements(id, motif);
    const transforms = placements.map((p) => p.transform);
    const svg = generateTessellation(request(id, motif)).svg.repeat;
    const drawn = placementsInSvg(svg);

    const match = (m: Affine, set: readonly Affine[], tolerance: number) =>
      set.filter((other) => {
        for (let i = 0; i < 4; i++) if (Math.abs(m[i] - other[i]) > tolerance) return false;
        return isLatticeVector(group, [m[4] - other[4], m[5] - other[5]], tolerance);
      }).length;

    it("maps the placed copies to themselves under each generator, modulo the lattice", () => {
      for (const generator of group.generators) {
        for (const m of transforms) {
          expect(match(compose(generator, m), transforms, 1e-9), `${generator}`).toBeGreaterThan(0);
        }
      }
    });

    it("does the same for the copies written into the SVG, including the basis translations", () => {
      expect(drawn).toHaveLength(transforms.length);
      for (const m of drawn) {
        for (const generator of group.generators) expect(match(compose(generator, m), drawn, 2e-4), `${generator}`).toBeGreaterThan(0);
        for (const [x, y] of group.basis) expect(match(compose(translation(x, y), m), drawn, 2e-4)).toBeGreaterThan(0);
      }
    });

    it("keeps each motif inside its own tile, so copies never overlap", () => {
      const fit = fitMotif(group, motif);
      const area = Math.abs(group.domain.reduce((sum, [x0, y0], i) => {
        const [x1, y1] = group.domain[(i + 1) % group.domain.length];
        return sum + x0 * y1 - x1 * y0;
      }, 0)) / 2;
      for (const shape of MOTIFS[motif]) {
        for (const point of shape.points) expect(inPolygon(group.domain, applyAffine(fit, point)), `${point}`).toBe(true);
      }
      // Big enough to read: its scale is a real fraction of the tile, not a speck.
      const scale = Math.hypot(fit[0], fit[1]);
      expect(scale).toBeGreaterThan(Math.sqrt(area) * 0.2);
    });

    it("is seamless: translating by the cell maps the drawn tile to itself", () => {
      const steps: Vec[] = [[width, 0], [-width, 0], [0, height], [0, -height]];
      const reaches = (m: Affine) => {
        const points = MOTIFS[motif].flatMap((s) => s.points).map((p) => applyAffine(m, p));
        const xs = points.map(([x]) => x);
        const ys = points.map(([, y]) => y);
        return Math.max(...xs) > 1e-3 && Math.min(...xs) < width - 1e-3 && Math.max(...ys) > 1e-3 && Math.min(...ys) < height - 1e-3;
      };
      for (const m of drawn) {
        for (const [dx, dy] of steps) {
          const moved = compose(translation(dx, dy), m);
          if (!reaches(moved)) continue;
          expect(drawn.some((other) => other.every((v, i) => Math.abs(v - moved[i]) < 2e-4)), `${m} by ${dx},${dy}`).toBe(true);
        }
      }
    });

    it("has matching colors along opposite edges of the tile", () => {
      for (let i = 0; i < 60; i++) {
        const t = (i + 0.37) / 60;
        const inset = 1e-4;
        expect(colorAt(motif, drawn, [inset, t * height])).toBe(colorAt(motif, drawn, [width + inset, t * height]));
        expect(colorAt(motif, drawn, [t * width, inset])).toBe(colorAt(motif, drawn, [t * width, height + inset]));
      }
    });
  });

  it("states its symmetry and repeat size", () => {
    const result = generateTessellation(request(id));
    expect(result.group.id).toBe(id);
    expect(result.symmetry.length).toBeGreaterThanOrEqual(4);
    expect(result.copies * 1).toBeGreaterThanOrEqual(1);
    expect(result.svg.repeat).toContain(`width="4in"`);
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(result.svg.repeat)!;
    expect(Number(box[2]) / Number(box[1])).toBeCloseTo(height / width, 4);
    expect(result.svg.layout).toContain(`viewBox="0 0 ${Number((width * SVG_UNITS * 3).toFixed(3))} ${Number((height * SVG_UNITS * 2).toFixed(3))}"`);
    expect(result.svg.layout.match(/<use /g)).toHaveLength(6);
    expect(result.svg.layout).not.toContain("undefined");
    expect(result.svg.repeat).not.toContain("NaN");
  });
});

describe("hexagonal repeats", () => {
  it.each(["p3", "p3m1", "p31m", "p6", "p6m"] as const)("%s is a non-square rectangle at true height", (id) => {
    const result = generateTessellation(request(id));
    expect(result.height).toBe("~6 7/8"); // 4 x sqrt(3) = 6.928, to the nearest eighth.
    expect(result.svg.repeat).toContain('height="6.928in"');
    expect(result.steps.join(" ")).toContain("1.73");
  });
});

describe("motifs", () => {
  /** Share of sample points whose fill differs after a symmetry, over the motif's painted area. */
  const mismatch = (motif: TessellationMotif, map: (p: Vec) => Vec) => {
    let differ = 0;
    let painted = 0;
    for (let i = -60; i <= 60; i++) {
      for (let j = -60; j <= 60; j++) {
        const p: Vec = [i / 50, j / 50];
        const here = motifColorAt(motif, p);
        if (here === "background") continue;
        painted++;
        if (motifColorAt(motif, map(p)) !== here) differ++;
      }
    }
    return differ / painted;
  };

  it.each(MOTIF_IDS)("%s has no symmetry of its own", (motif) => {
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    for (let i = -60; i <= 60; i++) {
      for (let j = -60; j <= 60; j++) {
        if (motifColorAt(motif, [i / 50, j / 50]) !== "background") {
          sumX += i / 50;
          sumY += j / 50;
          count++;
        }
      }
    }
    const cx = sumX / count;
    const cy = sumY / count;
    // Any symmetry of a shape passes through its center of area, so these cover them all.
    for (const order of [2, 3, 4, 6]) {
      const a = (2 * Math.PI) / order;
      const rotated = mismatch(motif, ([x, y]) => [cx + Math.cos(a) * (x - cx) - Math.sin(a) * (y - cy), cy + Math.sin(a) * (x - cx) + Math.cos(a) * (y - cy)]);
      expect(rotated, `turn 1/${order}`).toBeGreaterThan(0.1);
    }
    for (let degrees = 0; degrees < 180; degrees += 5) {
      const a = (2 * degrees * Math.PI) / 180;
      const mirrored = mismatch(motif, ([x, y]) => [cx + Math.cos(a) * (x - cx) + Math.sin(a) * (y - cy), cy + Math.sin(a) * (x - cx) - Math.cos(a) * (y - cy)]);
      expect(mirrored, `mirror at ${degrees}`).toBeGreaterThan(0.08);
    }
  });
});

describe("outlines", () => {
  it("draws the tile outlines only when asked", () => {
    expect(generateTessellation(request("p6")).svg.repeat).not.toContain('fill="none"');
    expect(generateTessellation(request("p6", "leaf", { outlines: true })).svg.repeat).toContain('fill="none"');
  });

  it("gives different tiles different layout ids", () => {
    const id = (req: TessellationRequest) => /<g id="([^"]+)"/.exec(generateTessellation(req).svg.layout)![1];
    expect(id(request("p6"))).not.toBe(id(request("p3")));
    expect(id(request("p6"))).not.toBe(id(request("p6", "fish")));
    expect(id(request("p6"))).not.toBe(id(request("p6", "leaf", { outlines: true })));
  });
});

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it("keeps the option lists in step with the engine", () => {
    expect(GROUPS).toEqual([...GROUP_IDS]);
    expect(STATE_MOTIFS).toEqual([...MOTIF_IDS]);
    expect(listTessellationOptions().groups.map((g) => g.id)).toEqual([...GROUP_IDS]);
  });

  it.each(LOCALE_CODES)("round trips in %s", (locale) => {
    const base = defaultTessellationState(locale);
    expect(serializeTessellationState(base)).toBe("");
    expect(parseTessellationState(params(""), locale)).toEqual(base);
    for (const group of GROUP_IDS) {
      const state: TessellationRequest = { ...base, group, motif: "fish", colors: { background: "#010203", primary: "#a0b0c0", accent: "#ffeedd" }, repeatWidth: 8, across: 6, down: 5, outlines: true };
      expect(parseTessellationState(params(serializeTessellationState(state)), locale)).toEqual(state);
    }
  });

  it("leaves out defaults, so links stay short", () => {
    expect(serializeTessellationState({ ...defaultTessellationState(), group: "p6m" })).toBe("g=p6m");
  });

  it("falls back on bad input", () => {
    const base = defaultTessellationState();
    const bad = parseTessellationState(params("m=dragon&g=p7&bg=red&c1=12345&c2=%23aabbcc&w=7&x=0&y=99&lines=yes"));
    expect(bad).toEqual(base);
    expect(parseTessellationState(params("w=NaN&x=1e9&y=-1&g=__proto__&m=constructor"))).toEqual(base);
  });

  it("offers only sizes that make a valid request", () => {
    for (const w of REPEAT_OPTIONS) for (const n of COUNT_OPTIONS) expect(generateTessellation(request("cm", "bird", { repeatWidth: w, across: n, down: n })).svg.layout).toContain("<use");
  });

  it("has a different default palette in each language", () => {
    const palettes = LOCALE_CODES.map((locale) => JSON.stringify(defaultTessellationState(locale).colors));
    expect(new Set(palettes).size).toBe(5);
  });
});

describe("translations", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  /** Every string in a catalog, by its path. */
  const flatten = (value: unknown, path = ""): [string, string][] => {
    if (typeof value === "string") return [[path, value]];
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => flatten(child, `${path}.${key}`));
  };

  describe.each([["engine", engineText], ["site", siteText]] as const)("%s catalog", (_, catalog) => {
    it.each(LOCALE_CODES)("%s matches English in its keys and placeholders", (locale) => {
      const english = new Map(flatten(catalog.en));
      const here = new Map(flatten(catalog[locale]));
      expect([...here.keys()].sort()).toEqual([...english.keys()].sort());
      for (const [key, text] of here) {
        expect(text.trim(), key).not.toBe("");
        expect(placeholders(text), key).toEqual(placeholders(english.get(key)!));
      }
    });
  });

  it("is translated, not copied, apart from words shared with English", () => {
    for (const locale of ["es", "fr", "de", "pt"] as const) {
      const english = new Map(flatten(engineText.en));
      const same = flatten(engineText[locale]).filter(([key, text]) => english.get(key) === text);
      expect(same.length, locale).toBeLessThanOrEqual(3);
    }
  });

  it("keeps generated text safe for the PDF's WinAnsi font", () => {
    // Latin-1 plus the punctuation WinAnsi adds; nothing a standard Helvetica can't draw.
    for (const [key, text] of flatten(engineText)) expect(text, key).toMatch(/^[ -~ -ÿ–—‘’“”]*$/);
  });
});

describe("PDF", () => {
  it.each(LOCALE_CODES)("builds in %s for every group", async (locale) => {
    for (const group of GROUP_IDS) {
      const doc = await PDFDocument.load(await generateTessellationPdf(request(group, "fish", { locale, outlines: true })));
      expect(doc.getPageCount(), group).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(generateTessellation(request(group, "fish", { locale })))).not.toMatch(/\{\w+\}/);
    }
  }, 60000);

  it("handles the largest layout and a repeat too tall for a page", async () => {
    const doc = await PDFDocument.load(await generateTessellationPdf(request("p6m", "bird", { repeatWidth: 12, across: 8, down: 8 })));
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
  }, 60000);

  it("uses only JSON in its requests and results", () => {
    const result = generateTessellation(request("pgg"));
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
