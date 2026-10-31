import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Writer } from "./pdf";
import { say } from "./i18n";
import { drawKnitSquare, knitSquareText } from "./knitSquare";
import { CELL_INCHES } from "./stitchMarks";
import { generateStitchPattern, listStitchPatterns, requireStitch, stitchChart } from "./stitchPattern";
import type { StitchRequest } from "./types";

/** A printable pattern: the numbers, the rows, and a line to check gauge. */
export async function generateStitchPdf(slug: string, request: StitchRequest): Promise<Uint8Array> {
  const stitch = requireStitch(slug);
  const result = generateStitchPattern(slug, request);
  const locale = request.locale ?? "en";
  const summary = listStitchPatterns(locale).find((s) => s.slug === slug)?.summary ?? stitch.summary;

  const doc = await PDFDocument.create();
  doc.setTitle(say(locale, "spTitle", { name: stitch.name }));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, `${stitch.name}, ${result.square?.width ?? result.width}" x ${result.square?.length ?? result.length}"`);

  w.text(stitch.name, { size: 22, bold: true });
  w.text(summary, { muted: true });
  w.gap(8);

  if (result.square) {
    drawKnitSquare(w, result.square);
    w.text(knitSquareText(locale, "rectangle"), { size: 15, bold: true });
    w.gap(4);
  }

  if (result.crochet) {
    w.text(result.crochet.materialsHeading, { size: 13, bold: true });
    for (const item of result.crochet.materials) w.text(`${item.label}: ${item.text}`);
  } else {
    w.text(say(locale, "spProject"), { size: 13, bold: true });
    w.text(say(locale, "spSize", { w: result.width, h: result.length }));
    w.text(say(locale, "spGauge", { s: request.stitchGauge, r: request.rowGauge }));
    w.text(`${result.startLabel}: ${result.startCount}`);
    w.text(say(locale, "spRows", { n: result.rows }));
    w.text(say(locale, "spYarn", { y: result.yards }));
  }
  w.gap(8);

  w.text(say(locale, "spBefore"), { size: 13, bold: true });
  w.text(say(locale, "spBeforeText"));
  w.gap(8);

  if (result.crochet) {
    for (const section of result.crochet.sections) {
      w.text(section.heading, { size: 13, bold: true });
      for (const line of section.lines) w.text(line.label ? `${line.label}: ${line.text}` : line.text);
      w.gap(8);
    }
  } else {
    w.text(say(locale, "spInstr"), { size: 13, bold: true });
    for (const line of result.setup) w.text(line);
    for (const row of result.pattern) w.text(`${row.label}: ${row.text}`);
    w.text(result.repeatNote);
    for (const line of result.finish) w.text(line);
    w.gap(8);
  }

  w.text(say(locale, "spChart"), { size: 13, bold: true });
  w.text(say(locale, stitch.craft === "knit" ? "spChartKnit" : "spChartCrochet"), { muted: true, size: 9 });
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

  if (!result.crochet) {
    w.text(say(locale, "spAbbr"), { size: 13, bold: true });
    w.text(result.abbreviations.join("; "), { muted: true });
  }

  return doc.save();
}
