import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { CROCHET_STITCHES, KNIT_STITCHES } from "./stitchCatalog";
import { crochetRowParts, generateStitchPattern, workedRow, writeKnitRow } from "./stitchPattern";
import { generateStitchPdf } from "./stitchPdf";
import type { StitchRequest } from "./types";

const req: StitchRequest = { width: 8, length: 8, stitchGauge: 18, rowGauge: 24, color: "#23395d" };
const knit = (slug: string) => KNIT_STITCHES.find((s) => s.slug === slug)!;

/** Follows written knit instructions back into stitches, as a knitter would. */
function expand(text: string, total: number): string[] {
  if (text === "Knit to end.") return Array(total).fill("k");
  if (text === "Purl to end.") return Array(total).fill("p");
  const match = /^\*(.+); repeat from \* to (?:end|last (\d+) sts?, (.+))\.$/.exec(text);
  if (!match) throw new Error(`Can't read: ${text}`);
  const read = (s: string) => s.split(", ").flatMap((run) => Array(Number(run.slice(1))).fill(run[0]));
  const repeat = read(match[1]);
  const tail = match[3] ? read(match[3]) : [];
  const out: string[] = [];
  while (out.length < total - tail.length) out.push(...repeat);
  return [...out, ...tail];
}

describe("knit stitches", () => {
  it.each(KNIT_STITCHES.map((s) => [s.slug, s] as const))("%s has an even row count, so right and wrong sides alternate", (_, s) => {
    expect(s.rows.length % 2).toBe(0);
  });

  it.each(KNIT_STITCHES.map((s) => [s.slug, s] as const))("%s's written rows work back to its chart at every width", (_, s) => {
    const rep = Math.max(...s.rows.map((r) => r.length));
    for (let n = 1; n <= 12; n++) {
      const total = n * rep + s.extra;
      s.rows.forEach((row, r) => {
        const worked = workedRow(s, r, total);
        expect(expand(writeKnitRow(worked, row.length), total)).toEqual(worked);
        // And what's worked is what the chart shows, seen from the right side.
        const shown = (r % 2 === 0 ? [...worked].reverse() : worked.map((st) => (st === "k" ? "p" : "k")));
        shown.forEach((st, c) => expect(st).toBe(row[c % row.length]));
      });
    }
  });

  it("writes the classic instructions", () => {
    const row = (slug: string, r: number, total: number) => writeKnitRow(workedRow(knit(slug), r, total), knit(slug).rows[r].length);
    expect(row("garter-stitch", 0, 20)).toBe("Knit to end.");
    expect(row("garter-stitch", 1, 20)).toBe("Knit to end.");
    expect(row("stockinette-stitch", 1, 20)).toBe("Purl to end.");
    expect(row("seed-stitch", 0, 21)).toBe("*k1, p1; repeat from * to last 1 st, k1.");
    expect(row("seed-stitch", 1, 21)).toBe("*k1, p1; repeat from * to last 1 st, k1.");
    expect(row("one-by-one-rib", 1, 21)).toBe("*p1, k1; repeat from * to last 1 st, p1.");
    expect(row("two-by-two-rib", 0, 22)).toBe("*k2, p2; repeat from * to last 2 sts, k2.");
    expect(row("two-by-two-rib", 1, 22)).toBe("*p2, k2; repeat from * to last 2 sts, p2.");
    expect(row("broken-rib", 1, 21)).toBe("Purl to end.");
  });
});

describe("crochet stitches", () => {
  it.each(CROCHET_STITCHES.map((s) => [s.slug, s] as const))("%s keeps its stitch count at every width", (_, s) => {
    for (let n = 2; n <= 40; n++) {
      const first = crochetRowParts(s.first, n);
      expect(first.consume, `row 1 uses the whole chain, n=${n}`).toBe(s.chains(n));
      for (const row of s.rows) {
        const next = crochetRowParts(row, n);
        expect(next.makes.length, `same width, n=${n}`).toBe(first.makes.length);
        expect(next.consume, `uses the row below, n=${n}`).toBe(first.makes.length);
      }
    }
  });
});

describe("project numbers", () => {
  it("rounds a knit cast-on to whole repeats plus balancing stitches", () => {
    const result = generateStitchPattern("two-by-two-rib", req); // 36 wanted: 4n + 2 = 38 or 34
    expect((result.startCount - 2) % 4).toBe(0);
    expect(Math.abs(result.startCount - 36)).toBeLessThanOrEqual(2);
    expect(result.rows % 2).toBe(0);
  });

  it("uses plain counts for a plain stitch", () => {
    const result = generateStitchPattern("single-crochet", { ...req, stitchGauge: 14, rowGauge: 16 });
    expect(result.stitchesPerRow).toBe(28);
    expect(result.startCount).toBe(29);
    expect(result.rows).toBe(32);
  });

  it("stays near the rule of thumb for familiar projects", () => {
    // A worsted garter dishcloth takes very roughly 40 to 80 yards.
    const cloth = generateStitchPattern("garter-stitch", { ...req, rowGauge: 34 }).yards;
    expect(cloth).toBeGreaterThan(40);
    expect(cloth).toBeLessThan(80);
  });

  it("reports the finished size after rounding", () => {
    expect(generateStitchPattern("stockinette-stitch", { ...req, width: 10, length: 10 }).width).toBe("10");
  });
});

describe("stitch pdf", () => {
  it.each([...KNIT_STITCHES, ...CROCHET_STITCHES].map((s) => [s.slug] as const))("builds %s", async (slug) => {
    const doc = await PDFDocument.load(await generateStitchPdf(slug, req));
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
