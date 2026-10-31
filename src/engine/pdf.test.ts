import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { BLOCKS } from "./blocks";
import { generatePatternPdf } from "./pdf";
import { defaultRequest } from "./testRequest";

describe("pattern pdf", () => {
  it.each(BLOCKS.map((b) => [b.slug, b] as const))("builds %s at small, off-ruler and large sizes", async (slug, block) => {
    for (const size of [3, 11, 24]) {
      const bytes = await generatePatternPdf(slug, { ...defaultRequest(block), size, sashing: 1 });
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
      const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
      expect([w, h]).toEqual([612, 792]);
    }
  });
});
