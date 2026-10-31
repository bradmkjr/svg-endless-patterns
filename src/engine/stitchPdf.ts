import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Writer } from "./pdf";
import { CELL_INCHES } from "./stitchMarks";
import { generateStitchPattern, requireStitch, stitchChart } from "./stitchPattern";
import type { StitchRequest } from "./types";

/** A printable pattern: the numbers, the rows, and a line to check gauge. */
export async function generateStitchPdf(slug: string, request: StitchRequest): Promise<Uint8Array> {
  const stitch = requireStitch(slug);
  const result = generateStitchPattern(slug, request);

  const doc = await PDFDocument.create();
  doc.setTitle(`${stitch.name} pattern`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, `${stitch.name}, ${result.width}" x ${result.length}"`);

  w.text(stitch.name, { size: 22, bold: true });
  w.text(stitch.summary, { muted: true });
  w.gap(8);

  w.text("Your project", { size: 13, bold: true });
  w.text(`Finished size: ${result.width}" x ${result.length}"`);
  w.text(`Gauge: ${request.stitchGauge} stitches and ${request.rowGauge} rows per 4"`);
  w.text(`${result.startLabel}: ${result.startCount}`);
  w.text(`Rows: ${result.rows}`);
  w.text(`Yarn: about ${result.yards} yards. This is a rough estimate, so buy extra.`);
  w.gap(8);

  w.text("Before you start", { size: 13, bold: true });
  w.text("Work a swatch at least 4\" wide and measure it. If your gauge differs, the size and the yarn needed will change too.");
  w.gap(8);

  w.text("Instructions", { size: 13, bold: true });
  for (const line of result.setup) w.text(line);
  for (const row of result.pattern) w.text(`${row.label}: ${row.text}`);
  w.text(result.repeatNote);
  for (const line of result.finish) w.text(line);
  w.gap(8);

  w.text("Chart", { size: 13, bold: true });
  w.text(stitch.craft === "knit" ? "Each square is one stitch, seen from the right side. Blank = knit, dash = purl. Start at row 1, at the bottom." : "The first rows at a small width. Start at row 1, at the bottom. X = sc, T = hdc, crossed T = dc, oval = ch.", { muted: true, size: 9 });
  w.gap(6);
  const chart = stitchChart(stitch);
  const cell = CELL_INCHES * 72;
  w.ensure(chart.height * cell + 8);
  const left = 36;
  const top = w.y;
  const px = (x: number) => left + x * cell;
  const py = (y: number) => top - y * cell;
  const ink = rgb(0.13, 0.12, 0.1);
  for (const m of chart.marks) {
    if (m.kind === "line") w.page.drawLine({ start: { x: px(m.x1), y: py(m.y1) }, end: { x: px(m.x2), y: py(m.y2) }, thickness: 1, color: ink });
    if (m.kind === "box") w.page.drawRectangle({ x: px(m.x), y: py(m.y + m.h), width: m.w * cell, height: m.h * cell, borderColor: rgb(0.55, 0.55, 0.55), borderWidth: 0.5 });
    if (m.kind === "ring") w.page.drawEllipse({ x: px(m.x), y: py(m.y), xScale: m.rx * cell, yScale: m.ry * cell, borderColor: ink, borderWidth: 0.8 });
    if (m.kind === "label") w.page.drawText(m.text, { x: px(m.x) - w.font.widthOfTextAtSize(m.text, 8) / 2, y: py(m.y) - 3, size: 8, font: w.font, color: ink });
  }
  w.y = top - chart.height * cell;
  w.gap(10);

  w.text("Abbreviations", { size: 13, bold: true });
  w.text(result.abbreviations.join("; "), { muted: true });

  return doc.save();
}
