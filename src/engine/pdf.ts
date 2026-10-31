import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { generatePattern, fabricLabel, requireBlock } from "./index";
import { say } from "./i18n";
import { blockPieces, type Point } from "./pieces";
import { blockTemplates } from "./templates";
import type { PatternRequest } from "./types";

const PT = 72;
const PAGE_W = 8.5 * PT;
const PAGE_H = 11 * PT;
const MARGIN = 0.5 * PT;
const INK = rgb(0.13, 0.12, 0.1);
const MUTED = rgb(0.4, 0.38, 0.34);

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function pathOf(points: Point[], scale: number) {
  return `M ${points.map(([x, y]) => `${(x * scale).toFixed(3)} ${(y * scale).toFixed(3)}`).join(" L ")} Z`;
}

/** A top-down text cursor that starts a new page when it runs out of room. */
export class Writer {
  page!: PDFPage;
  y = 0;

  constructor(private doc: PDFDocument, readonly font: PDFFont, private bold: PDFFont, private footer: string) {
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.page.drawText(this.footer, { x: MARGIN, y: 20, size: 8, font: this.font, color: MUTED });
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  text(text: string, { size = 10, bold = false, x = MARGIN, muted = false } = {}) {
    const font = bold ? this.bold : this.font;
    const width = PAGE_W - MARGIN - x;
    const words = text.split(" ");
    let line = "";
    const flush = () => {
      this.ensure(size * 1.4);
      this.page.drawText(line, { x, y: this.y - size, size, font, color: muted ? MUTED : INK });
      this.y -= size * 1.4;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        flush();
        line = word;
      } else {
        line = next;
      }
    }
    if (line) flush();
  }

  gap(height: number) {
    this.y -= height;
  }
}

/** A printable pattern: overview, cutting list, steps, and true-size templates. */
export async function generatePatternPdf(slug: string, request: PatternRequest): Promise<Uint8Array> {
  const block = requireBlock(slug);
  const result = generatePattern(slug, request);
  const locale = request.locale ?? "en";
  const label = (id: string) => fabricLabel(block, id, locale);

  const doc = await PDFDocument.create();
  doc.setTitle(say(locale, "pdfTitle", { name: block.name }));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, say(locale, "pdfFooter", { name: block.name, size: request.size }));

  w.text(block.name, { size: 22, bold: true });
  w.text(say(locale, "pdfSub", { size: request.size, w: result.quilt.widthLabel, h: result.quilt.heightLabel, n: result.quilt.blocks }), { muted: true });
  w.gap(10);

  const drawSize = 3 * PT;
  w.ensure(drawSize);
  const scale = drawSize / block.grid;
  for (const piece of blockPieces(block)) {
    const c = color(request.colors[piece.fabric] ?? "#cccccc");
    w.page.drawSvgPath(pathOf(piece.points, scale), { x: MARGIN, y: w.y, color: c, borderColor: c, borderWidth: 0.4 });
  }
  w.y -= drawSize + 14;

  w.text(say(locale, "pdfBuy"), { size: 13, bold: true });
  for (const { label: name, yards } of result.yardage) w.text(`${name}: ${yards} yd`);
  w.text(say(locale, result.backing.panels === 1 ? "pdfBackingOne" : "pdfBackingMany", { y: result.backing.yards, n: result.backing.panels, w: result.backing.width, h: result.backing.height }));
  w.text(say(locale, "pdfBinding", { y: result.binding.yards, n: result.binding.strips, w: result.binding.stripWidth }));
  w.text(say(locale, "pdfBatting", { w: result.backing.width, h: result.backing.height }));
  w.text(say(locale, "pdfWidth", { w: request.wof }), { muted: true, size: 9 });
  w.gap(10);

  w.text(say(locale, "pdfCuts"), { size: 13, bold: true });
  const fabrics = [...new Set(result.quiltCuts.map((c) => c.fabric))];
  for (const fabric of fabrics) {
    w.text(label(fabric), { bold: true });
    for (const cut of result.quiltCuts.filter((c) => c.fabric === fabric)) {
      w.text(`${cut.description}${cut.rounded ? say(locale, "pdfRounded") : ""}`, { x: MARGIN + 10 });
    }
  }
  w.gap(10);

  w.text(say(locale, "pdfPiecing"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));

  // Templates: true size, packed left to right on as many pages as they need.
  w.newPage();
  w.text(say(locale, "pdfTemplates"), { size: 13, bold: true });
  w.text(say(locale, "pdfTemplateHelp"), { muted: true, size: 9 });
  w.gap(6);
  w.ensure(PT + 14);
  w.page.drawRectangle({ x: MARGIN, y: w.y - PT, width: PT, height: PT, borderColor: INK, borderWidth: 0.75 });
  w.page.drawText(say(locale, "pdfInch"), { x: MARGIN + 8, y: w.y - PT / 2 - 3, size: 9, font, color: INK });
  w.y -= PT + 14;

  const LINE = 11;
  const tooLarge: string[] = [];
  let x = MARGIN;
  let rowHeight = 0;
  for (const template of blockTemplates(block, request.size, result.quilt.blocks, locale)) {
    const xs = template.cutting.map(([px]) => px);
    const ys = template.cutting.map(([, py]) => py);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const shapeW = (Math.max(...xs) - minX) * PT;
    const shapeH = (Math.max(...ys) - minY) * PT;
    const title = `${template.label}: ${template.name}`;
    const counts = template.counts.map((c) => `${label(c.fabric)} x${c.count}`).join(", ");

    if (shapeW > PAGE_W - 2 * MARGIN || shapeH + 2 * LINE > PAGE_H - 2 * MARGIN - 20) {
      tooLarge.push(title);
      continue;
    }
    const itemW = Math.max(shapeW, font.widthOfTextAtSize(title, 8), font.widthOfTextAtSize(counts, 8));
    const itemH = shapeH + 2 * LINE + 14;
    if (x + itemW > PAGE_W - MARGIN) {
      x = MARGIN;
      w.y -= rowHeight;
      rowHeight = 0;
    }
    if (w.y - itemH < MARGIN) {
      w.newPage();
      x = MARGIN;
      rowHeight = 0;
    }
    const shift = (points: Point[]): Point[] => points.map(([px, py]) => [px - minX, py - minY]);
    w.page.drawSvgPath(pathOf(shift(template.cutting), PT), { x, y: w.y, borderColor: INK, borderWidth: 0.75 });
    w.page.drawSvgPath(pathOf(shift(template.finished), PT), { x, y: w.y, borderColor: MUTED, borderWidth: 0.5, borderDashArray: [3, 3] });
    w.page.drawText(title, { x, y: w.y - shapeH - LINE, size: 8, font: bold, color: INK });
    w.page.drawText(counts, { x, y: w.y - shapeH - 2 * LINE, size: 8, font, color: MUTED });
    x += itemW + 18;
    rowHeight = Math.max(rowHeight, itemH);
  }
  if (tooLarge.length) {
    w.y -= rowHeight;
    w.gap(6);
    w.text(say(locale, "pdfTooLarge", { list: tooLarge.join("; ") }), { muted: true, size: 9 });
  }

  return doc.save();
}
