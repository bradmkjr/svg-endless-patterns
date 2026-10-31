import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { generatePattern, fabricLabel, requireBlock } from "./index";
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
class Writer {
  page!: PDFPage;
  y = 0;

  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont, private footer: string) {
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
  const label = (id: string) => fabricLabel(block, id);

  const doc = await PDFDocument.create();
  doc.setTitle(`${block.name} quilt pattern`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, `${block.name}, ${request.size}" block`);

  w.text(block.name, { size: 22, bold: true });
  w.text(`${request.size}" finished block. Quilt top ${result.quilt.widthLabel}" x ${result.quilt.heightLabel}", ${result.quilt.blocks} blocks.`, { muted: true });
  w.gap(10);

  const drawSize = 3 * PT;
  w.ensure(drawSize);
  const scale = drawSize / block.grid;
  for (const piece of blockPieces(block)) {
    const c = color(request.colors[piece.fabric] ?? "#cccccc");
    w.page.drawSvgPath(pathOf(piece.points, scale), { x: MARGIN, y: w.y, color: c, borderColor: c, borderWidth: 0.4 });
  }
  w.y -= drawSize + 14;

  w.text("Fabric to buy", { size: 13, bold: true });
  for (const { label: name, yards } of result.yardage) w.text(`${name}: ${yards} yd`);
  w.text(`Backing: ${result.backing.yards} yd (${result.backing.panels} panel${result.backing.panels === 1 ? "" : "s"}, finished piece ${result.backing.width}" x ${result.backing.height}")`);
  w.text(`Binding: ${result.binding.yards} yd (${result.binding.strips} strips, ${result.binding.stripWidth}" wide)`);
  w.text(`Batting: at least ${result.backing.width}" x ${result.backing.height}"`);
  w.text(`Based on ${request.wof}" usable fabric width. Includes a 10% allowance.`, { muted: true, size: 9 });
  w.gap(10);

  w.text("Cutting list, whole quilt top", { size: 13, bold: true });
  const fabrics = [...new Set(result.quiltCuts.map((c) => c.fabric))];
  for (const fabric of fabrics) {
    w.text(label(fabric), { bold: true });
    for (const cut of result.quiltCuts.filter((c) => c.fabric === fabric)) {
      w.text(`${cut.description}${cut.rounded ? " (rounded up: trim to size)" : ""}`, { x: MARGIN + 10 });
    }
  }
  w.gap(10);

  w.text("Piecing", { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));

  // Templates: true size, packed left to right on as many pages as they need.
  w.newPage();
  w.text("Templates", { size: 13, bold: true });
  w.text("Print at 100% (\"actual size\"), then check the 1 inch square. Solid line: cut. Dashed line: sew. Counts cover the whole quilt top.", { muted: true, size: 9 });
  w.gap(6);
  w.ensure(PT + 14);
  w.page.drawRectangle({ x: MARGIN, y: w.y - PT, width: PT, height: PT, borderColor: INK, borderWidth: 0.75 });
  w.page.drawText("1 inch", { x: MARGIN + 18, y: w.y - PT / 2 - 3, size: 9, font, color: INK });
  w.y -= PT + 14;

  const LINE = 11;
  const tooLarge: string[] = [];
  let x = MARGIN;
  let rowHeight = 0;
  for (const template of blockTemplates(block, request.size, result.quilt.blocks)) {
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
    w.text(`Too large for one sheet, so cut these from the cutting list: ${tooLarge.join("; ")}.`, { muted: true, size: 9 });
  }

  return doc.save();
}
