import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateTartan, sett, tartanTileSize, threadOrder, twillColor, type TartanRequest } from "./tartan";
import { generateTartanPdf } from "./tartanPdf";

const A = "#111111";
const B = "#222222";
const C = "#333333";
const req: TartanRequest = { stripes: [{ color: A, count: 4 }, { color: B, count: 2 }, { color: C, count: 6 }], mirrored: true, threadsPerInch: 24, width: 10, length: 20 };

describe("thread order", () => {
  it("mirrors without doubling the end stripes", () => {
    expect(sett(req.stripes, true).map((s) => s.color)).toEqual([A, B, C, B]);
    expect(threadOrder(req.stripes, true)).toHaveLength(4 + 2 + 6 + 2);
    expect(generateTartan(req).order).toBe("A4 B2 C6 B2");
  });

  it("repeats as given when not mirrored", () => {
    expect(threadOrder(req.stripes, false)).toHaveLength(12);
    expect(generateTartan({ ...req, mirrored: false }).order).toBe("A4 B2 C6");
  });

  it("gives two stripes a plain check", () => {
    expect(sett(req.stripes.slice(0, 2), true)).toHaveLength(2);
  });
});

describe("weave", () => {
  it("is a true 2/2 twill: each thread shows for two crossings, then hides for two", () => {
    const order = [0, 1, 2, 3, 4, 5, 6, 7];
    // Column 3 over eight rows, leaving out row 3, where the weft is the same thread.
    const shown = [0, 1, 2, 4, 5, 6, 7].map((y) => twillColor(order, 3, y));
    expect(shown.map((c) => c === 3)).toEqual([false, true, true, false, true, true, false]);
  });

  it.each([3, 5, 6, 8, 14, 19])("tile of a %i-thread repeat meets itself on every edge", (threads) => {
    const order = Array.from({ length: threads }, (_, i) => i);
    const side = tartanTileSize(threads);
    expect(side % 4).toBe(0);
    expect(side % threads).toBe(0);
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        expect(twillColor(order, i + side, j)).toBe(twillColor(order, i, j));
        expect(twillColor(order, i, j + side)).toBe(twillColor(order, i, j));
      }
    }
  });
});

describe("weaving numbers", () => {
  const result = generateTartan(req);

  it("counts ends and picks from size and thread density", () => {
    expect(result.warpEnds).toBe(240);
    expect(result.weftPicks).toBe(480);
  });

  it("accounts for every thread by color", () => {
    expect(result.colors.reduce((sum, c) => sum + c.warpEnds, 0)).toBe(result.warpEnds);
    expect(result.colors.reduce((sum, c) => sum + c.weftPicks, 0)).toBe(result.weftPicks);
  });

  it("includes warp waste, weft width and an allowance in yarn", () => {
    // 240 ends x 44" + 480 picks x 10" = 15360", x 1.1 = 468 yd, before rounding up per color.
    expect(result.totalYards).toBeGreaterThanOrEqual(470);
    expect(result.totalYards).toBeLessThanOrEqual(472);
  });

  it("sizes the swatch at true scale", () => {
    expect(result.svg.swatch).toContain('viewBox="0 0 28 28"');
    expect(result.svg.swatch).toContain('width="1.167in"');
  });

  it.each(["en", "es", "fr", "de", "pt"] as const)("builds a %s guide", async (locale) => {
    const doc = await PDFDocument.load(await generateTartanPdf({ ...req, locale }));
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(generateTartan({ ...req, locale }).steps)).not.toMatch(/\{\w+\}/);
  });
});
