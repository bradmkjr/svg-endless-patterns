import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { BLOCKS } from "./blocks";
import { CATALOGS, ENGLISH_PHRASES, type Phrase } from "./i18n";
import { generatePattern } from "./index";
import { generatePatternPdf } from "./pdf";
import { STITCHES } from "./stitchCatalog";
import { generateStitchPattern } from "./stitchPattern";
import { generateStitchPdf } from "./stitchPdf";
import { defaultRequest } from "./testRequest";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const locales = Object.entries(CATALOGS);

describe.each(locales)("%s catalog", (locale, catalog) => {
  it("has every phrase, with the same placeholders", () => {
    for (const key of Object.keys(ENGLISH_PHRASES) as Phrase[]) {
      expect(catalog.phrases[key], key).toBeTruthy();
      expect(placeholders(catalog.phrases[key]), key).toEqual(placeholders(ENGLISH_PHRASES[key]));
    }
  });

  it("covers every block, fabric label, family and level", () => {
    for (const block of BLOCKS) {
      expect(catalog.blocks[block.slug]?.summary, block.slug).toBeTruthy();
      expect(catalog.blocks[block.slug]?.assembly, block.slug).toBeTruthy();
      expect(catalog.families[block.family], block.family).toBeTruthy();
      expect(catalog.levels[block.level], block.level).toBeTruthy();
      for (const fabric of block.fabrics) expect(catalog.fabrics[fabric.label], fabric.label).toBeTruthy();
      for (const unit of block.units) if (unit.kind === "shape") expect(catalog.templates[unit.name], unit.name).toBeTruthy();
    }
  });

  it("covers every stitch", () => {
    for (const stitch of STITCHES) {
      expect(catalog.stitches[stitch.slug]?.summary, stitch.slug).toBeTruthy();
      if (stitch.craft === "crochet") {
        expect(catalog.stitches[stitch.slug].first, stitch.slug).toBeTruthy();
        expect(catalog.stitches[stitch.slug].rows, stitch.slug).toHaveLength(stitch.rows.length);
      }
    }
  });

  it("leaves no placeholder unfilled in generated text", () => {
    for (const block of BLOCKS) {
      const result = generatePattern(block.slug, { ...defaultRequest(block), locale: locale as never, sashing: 1 });
      expect(JSON.stringify({ ...result, svg: null }), block.slug).not.toMatch(/\{\w+\}/);
    }
    for (const stitch of STITCHES) {
      const result = generateStitchPattern(stitch.slug, { width: 8, length: 8, stitchGauge: 18, rowGauge: 24, color: "#23395d", locale: locale as never });
      expect(JSON.stringify({ ...result, svg: null }), stitch.slug).not.toMatch(/\{\w+\}/);
    }
  });

  it("builds PDFs, whose fonts can't draw every character", async () => {
    for (const block of BLOCKS) await PDFDocument.load(await generatePatternPdf(block.slug, { ...defaultRequest(block), locale: locale as never }));
    for (const stitch of STITCHES) await PDFDocument.load(await generateStitchPdf(stitch.slug, { width: 8, length: 8, stitchGauge: 18, rowGauge: 24, color: "#23395d", locale: locale as never }));
  });

  it("changes the numbers no more than the words", () => {
    const ohio = BLOCKS.find((b) => b.slug === "ohio-star")!;
    const en = generatePattern("ohio-star", defaultRequest(ohio));
    const translated = generatePattern("ohio-star", { ...defaultRequest(ohio), locale: locale as never });
    expect(translated.quilt).toEqual(en.quilt);
    expect(translated.svg).toEqual(en.svg);
    expect(translated.yardage.map((y) => y.yards)).toEqual(en.yardage.map((y) => y.yards));
    expect(translated.steps).not.toEqual(en.steps);
  });
});
