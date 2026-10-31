import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { cellColor, crossStitchText, cropGrid, generateCrossStitch, SYMBOLS, type CrossStitchRequest } from "./crossStitch";
import { Writer } from "./pdf";

const INK = rgb(0.1, 0.1, 0.1);
const GRID_LINE = rgb(0.7, 0.68, 0.64);
const LEFT = 36;
const RIGHT = 576;
/** Room around the chart for numbers and center arrows. */
const BAND = 24;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A printable chart: size, color key and steps, then the symbol chart on its own page. */
export async function generateCrossStitchPdf(request: CrossStitchRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateCrossStitch(request);
  const grid = cropGrid(request.grid);
  const columns = grid[0]?.length ?? 0;
  const rows = grid.length;
  const cross = request.craft === "cross";

  const doc = await PDFDocument.create();
  const title = crossStitchText(locale, cross ? "pdfTitleCross" : "pdfTitleCanvas");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  w.text(title, { size: 22, bold: true });
  w.text(crossStitchText(locale, "pdfSize", { w: result.width, h: result.height, count: request.count, columns: result.columns, rows: result.rows }), { muted: true });
  w.gap(10);

  // A small picture of the design, to check the chart against.
  const pictureCell = Math.min(180 / Math.max(columns, rows, 1), 8);
  const pictureH = rows * pictureCell;
  w.ensure(pictureH + 12);
  w.page.drawRectangle({ x: LEFT, y: w.y - pictureH, width: columns * pictureCell, height: pictureH, color: color(request.fabric), borderColor: GRID_LINE, borderWidth: 0.5 });
  grid.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const c = cellColor(cell);
      if (c >= 0) w.page.drawRectangle({ x: LEFT + x * pictureCell, y: w.y - (y + 1) * pictureCell, width: pictureCell, height: pictureCell, color: color(request.colors[c]) });
    });
  });
  w.y -= pictureH + 12;

  w.text(crossStitchText(locale, "pdfColors"), { size: 13, bold: true });
  for (const c of result.colors.filter((entry) => entry.stitches > 0)) {
    w.ensure(16);
    w.page.drawRectangle({ x: LEFT, y: w.y - 11, width: 11, height: 11, color: color(c.color), borderColor: GRID_LINE, borderWidth: 0.5 });
    w.text(crossStitchText(locale, "pdfColor", { symbol: c.symbol, hex: c.color, n: c.stitches, y: c.yards }), { x: 54 });
  }
  w.text(crossStitchText(locale, cross ? "pdfTotalFloss" : "pdfTotalThread", { n: result.stitches, y: result.totalYards }), { muted: true });
  w.gap(10);

  w.text(crossStitchText(locale, "pdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));

  // The chart: every square is one stitch, sized to fill the page, with a line each 10 stitches.
  w.newPage();
  w.text(crossStitchText(locale, "pdfChart"), { size: 13, bold: true });
  w.text(crossStitchText(locale, "pdfChartHelp"), { muted: true, size: 9 });
  w.gap(4);
  const key = result.colors.filter((c) => c.stitches > 0).map((c) => `${c.symbol} = ${c.color}`).join("    ");
  if (key) w.text(key, { size: 9 });
  w.gap(4);

  const availableH = w.y - 36 - BAND;
  const cell = Math.min((RIGHT - LEFT - BAND) / Math.max(columns, 1), availableH / Math.max(rows, 1), 20);
  const left = LEFT + BAND;
  const top = w.y - BAND;
  const page = w.page;

  grid.forEach((row, y) => {
    [...row].forEach((value, x) => {
      const c = cellColor(value);
      if (c < 0) return;
      const size = cell * 0.68;
      const symbol = SYMBOLS[c];
      page.drawText(symbol, {
        x: left + x * cell + (cell - font.widthOfTextAtSize(symbol, size)) / 2,
        y: top - (y + 1) * cell + (cell - size * 0.72) / 2,
        size,
        font,
        color: INK,
      });
    });
  });
  const line = (x1: number, y1: number, x2: number, y2: number, major: boolean) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: major ? 1 : 0.35, color: major ? INK : GRID_LINE });
  for (const major of [false, true]) {
    for (let x = 0; x <= columns; x++) if ((x % 10 === 0) === major) line(left + x * cell, top, left + x * cell, top - rows * cell, major);
    for (let y = 0; y <= rows; y++) if ((y % 10 === 0) === major) line(left, top - y * cell, left + columns * cell, top - y * cell, major);
  }
  for (let x = 10; x <= columns; x += 10) {
    const label = String(x);
    page.drawText(label, { x: left + x * cell - font.widthOfTextAtSize(label, 7) / 2, y: top + 12, size: 7, font, color: INK });
  }
  for (let y = 10; y <= rows; y += 10) {
    const label = String(y);
    page.drawText(label, { x: left - 12 - font.widthOfTextAtSize(label, 7), y: top - y * cell - 2.5, size: 7, font, color: INK });
  }
  // Center arrows. drawSvgPath's y runs downward from the point it's given.
  page.drawSvgPath("M -4 0 L 4 0 L 0 7 Z", { x: left + (columns * cell) / 2, y: top + 9, color: INK });
  page.drawSvgPath("M 0 -4 L 0 4 L 7 0 Z", { x: left - 9, y: top - (rows * cell) / 2, color: INK });

  return doc.save();
}
