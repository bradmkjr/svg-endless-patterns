import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { cellColor, chartSheets, cropGrid, SHEET_COLUMNS, SHEET_ROWS, SYMBOLS } from "./countedChart";
import { Writer } from "./pdf";

const INK = rgb(0.1, 0.1, 0.1);
const GRID_LINE = rgb(0.7, 0.68, 0.64);
const OVERLAP = rgb(0.88, 0.88, 0.88);
const LEFT = 36;
const RIGHT = 576;
const BOTTOM = 36;
/** Room around the chart for numbers and center arrows. */
const BAND = 24;
/** Squares on a sheet of a split chart. A chart on one sheet grows to fill it, up to `LARGEST`. */
const SPLIT_CELL = 17;
const LARGEST = 20;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export type ProjectPdf = {
  title: string;
  size: string;
  ground: string;
  grid: string[];
  colors: string[];
  colorsHeading: string;
  /** One line per color used. */
  colorLines: { color: string; text: string }[];
  total: string;
  /** Headed lists in reading order: materials, steps, stitching order, finishing. */
  sections: { heading: string; lines: string[]; numbered?: boolean }[];
  chartHeading: string;
  chartHelp: string;
  sheetHelp: string;
  sheetTitle: (values: { n: number; total: number; c1: number; c2: number; r1: number; r2: number }) => string;
  key: string;
};

/** A complete project: picture, materials, every step, then the symbol chart on sheets of its own. */
export async function writeProjectPdf(p: ProjectPdf): Promise<Uint8Array> {
  const grid = cropGrid(p.grid);
  const columns = grid[0]?.length ?? 0;
  const rows = grid.length;

  const doc = await PDFDocument.create();
  doc.setTitle(p.title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, p.title);

  w.text(p.title, { size: 22, bold: true });
  w.text(p.size, { muted: true });
  w.gap(10);

  // A small picture of the design, to check the chart against.
  const pictureCell = Math.min(180 / Math.max(columns, rows, 1), 8);
  const pictureH = rows * pictureCell;
  w.ensure(pictureH + 12);
  w.page.drawRectangle({ x: LEFT, y: w.y - pictureH, width: columns * pictureCell, height: pictureH, color: color(p.ground), borderColor: GRID_LINE, borderWidth: 0.5 });
  grid.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const c = cellColor(cell);
      if (c >= 0) w.page.drawRectangle({ x: LEFT + x * pictureCell, y: w.y - (y + 1) * pictureCell, width: pictureCell, height: pictureCell, color: color(p.colors[c]) });
    });
  });
  w.y -= pictureH + 12;

  w.text(p.colorsHeading, { size: 13, bold: true });
  for (const line of p.colorLines) {
    w.ensure(16);
    w.page.drawRectangle({ x: LEFT, y: w.y - 11, width: 11, height: 11, color: color(line.color), borderColor: GRID_LINE, borderWidth: 0.5 });
    w.text(line.text, { x: 54 });
  }
  w.text(p.total, { muted: true });
  w.gap(10);

  for (const section of p.sections) {
    if (!section.lines.length) continue;
    w.ensure(50);
    w.text(section.heading, { size: 13, bold: true });
    section.lines.forEach((line, i) => w.text(section.numbered ? `${i + 1}. ${line}` : line));
    w.gap(10);
  }

  // The chart: every square is one stitch, with a line each 10 stitches counted across the whole design.
  const sheets = chartSheets(columns, rows);
  sheets.forEach((sheet, index) => {
    w.newPage();
    w.text(sheets.length > 1 ? p.sheetTitle({ n: index + 1, total: sheets.length, c1: sheet.column + 1, c2: sheet.column + sheet.columns, r1: sheet.row + 1, r2: sheet.row + sheet.rows }) : p.chartHeading, { size: 13, bold: true });
    w.text(p.chartHelp, { muted: true, size: 9 });
    if (sheets.length > 1) w.text(p.sheetHelp, { muted: true, size: 9 });
    w.gap(4);
    if (p.key) w.text(p.key, { size: 9 });
    w.gap(4);

    const availableH = w.y - BOTTOM - BAND;
    const availableW = RIGHT - LEFT - BAND;
    const cell = sheets.length > 1 ? Math.min(SPLIT_CELL, availableW / SHEET_COLUMNS, availableH / SHEET_ROWS) : Math.min(availableW / Math.max(columns, 1), availableH / Math.max(rows, 1), LARGEST);
    const left = LEFT + BAND;
    const top = w.y - BAND;
    const page = w.page;
    const xOf = (column: number) => left + (column - sheet.column) * cell;
    const yOf = (row: number) => top - (row - sheet.row) * cell;
    const lastColumn = sheet.column + sheet.columns;
    const lastRow = sheet.row + sheet.rows;

    // Shaded squares repeat from the neighboring sheet.
    if (sheet.overlapColumns) page.drawRectangle({ x: left, y: yOf(lastRow), width: sheet.overlapColumns * cell, height: sheet.rows * cell, color: OVERLAP });
    if (sheet.overlapRows) page.drawRectangle({ x: left, y: yOf(sheet.row + sheet.overlapRows), width: sheet.columns * cell, height: sheet.overlapRows * cell, color: OVERLAP });

    for (let y = sheet.row; y < lastRow; y++) {
      for (let x = sheet.column; x < lastColumn; x++) {
        const c = cellColor(grid[y][x]);
        if (c < 0) continue;
        const size = cell * 0.68;
        const symbol = SYMBOLS[c];
        page.drawText(symbol, { x: xOf(x) + (cell - font.widthOfTextAtSize(symbol, size)) / 2, y: yOf(y + 1) + (cell - size * 0.72) / 2, size, font, color: INK });
      }
    }
    const line = (x1: number, y1: number, x2: number, y2: number, major: boolean) => page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: major ? 1 : 0.35, color: major ? INK : GRID_LINE });
    for (const major of [false, true]) {
      for (let x = sheet.column; x <= lastColumn; x++) if ((x % 10 === 0) === major) line(xOf(x), top, xOf(x), yOf(lastRow), major);
      for (let y = sheet.row; y <= lastRow; y++) if ((y % 10 === 0) === major) line(left, yOf(y), xOf(lastColumn), yOf(y), major);
    }
    for (let x = Math.ceil(Math.max(sheet.column, 1) / 10) * 10; x <= lastColumn; x += 10) {
      const label = String(x);
      page.drawText(label, { x: xOf(x) - font.widthOfTextAtSize(label, 7) / 2, y: top + 12, size: 7, font, color: INK });
    }
    for (let y = Math.ceil(Math.max(sheet.row, 1) / 10) * 10; y <= lastRow; y += 10) {
      const label = String(y);
      page.drawText(label, { x: left - 12 - font.widthOfTextAtSize(label, 7), y: yOf(y) - 2.5, size: 7, font, color: INK });
    }
    // Center arrows, on each sheet the center falls on. drawSvgPath's y runs downward from the point it's given.
    if (columns / 2 >= sheet.column && columns / 2 <= lastColumn) page.drawSvgPath("M -4 0 L 4 0 L 0 7 Z", { x: xOf(columns / 2), y: top + 9, color: INK });
    if (rows / 2 >= sheet.row && rows / 2 <= lastRow) page.drawSvgPath("M 0 -4 L 0 4 L 7 0 Z", { x: left - 9, y: yOf(rows / 2), color: INK });
  });

  return doc.save();
}
