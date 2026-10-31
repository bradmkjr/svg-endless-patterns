import { appendBezierCurve, clip, closePath, endPath, lineTo, moveTo, PDFDocument, popGraphicsState, pushGraphicsState, rectangle, rgb, setLineWidth, setStrokingColor, StandardFonts, stroke, type PDFOperator, type PDFPage } from "pdf-lib";
import { Writer } from "./pdf";
import { generateSashiko, pointAt, sashikoRuns, sashikoSheets, sashikoText, SHEET_HEIGHT, SHEET_WIDTH, type SashikoRequest, type SashikoSheet, type Stroke } from "./sashiko";

const PT = 72;
const MARGIN = 0.5 * PT;
/** Top of a sheet's stitch area, below its one-line heading. */
const SHEET_TOP = 11 * PT - MARGIN - 20;
const INK = rgb(0.1, 0.1, 0.1);
const FAINT = rgb(0.65, 0.65, 0.65);
/** The check square on every sheet, under the stitch area. */
export const CHECK_X = MARGIN;
export const CHECK_Y = 40;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A panel position, in inches from its top left, as page points on a sheet. */
export function sheetPoint(sheet: SashikoSheet, x: number, y: number): [number, number] {
  return [MARGIN + (x - sheet.x) * PT, SHEET_TOP - (y - sheet.y) * PT];
}

/**
 * A stroke as path operators. Points are written directly in page space, with no
 * scaling, so a measurement on the page is a measurement on the panel.
 */
function strokeOps(s: Stroke, place: (x: number, y: number) => [number, number]): PDFOperator[] {
  const [x1, y1] = place(...pointAt(s, 0));
  const ops = [moveTo(x1, y1)];
  if (s.kind === "line") {
    const [x2, y2] = place(...pointAt(s, 1));
    ops.push(lineTo(x2, y2));
    return ops;
  }
  // A cubic curve per quarter turn is far closer than a printer can show.
  const parts = Math.max(1, Math.ceil((s.a1 - s.a0) / (Math.PI / 2)));
  const step = (s.a1 - s.a0) / parts;
  const k = (4 / 3) * Math.tan(step / 4) * s.r;
  for (let i = 0; i < parts; i++) {
    const a = s.a0 + i * step;
    const b = a + step;
    const [c1x, c1y] = place(s.cx + s.r * Math.cos(a) - k * Math.sin(a), s.cy + s.r * Math.sin(a) + k * Math.cos(a));
    const [c2x, c2y] = place(s.cx + s.r * Math.cos(b) + k * Math.sin(b), s.cy + s.r * Math.sin(b) - k * Math.cos(b));
    const [ex, ey] = place(s.cx + s.r * Math.cos(b), s.cy + s.r * Math.sin(b));
    ops.push(appendBezierCurve(c1x, c1y, c2x, c2y, ex, ey));
  }
  return ops;
}

/** `pushOperators` takes its operators as arguments, and large panels have too many for one call. */
function push(page: PDFPage, ops: PDFOperator[]) {
  for (let i = 0; i < ops.length; i += 5000) page.pushOperators(...ops.slice(i, i + 5000));
}

function boxOps(x: number, y: number, width: number, height: number): PDFOperator[] {
  return [moveTo(x, y), lineTo(x + width, y), lineTo(x + width, y + height), lineTo(x, y + height), closePath(), stroke()];
}

function bounds(s: Stroke): [number, number, number, number] {
  if (s.kind === "arc") {
    // A stitch is short, but its ends alone can miss the arc's bulge: pad by its sagitta.
    const pad = s.r * (1 - Math.cos((s.a1 - s.a0) / 2));
    const [x1, y1] = pointAt(s, 0);
    const [x2, y2] = pointAt(s, 1);
    return [Math.min(x1, x2) - pad, Math.min(y1, y2) - pad, Math.max(x1, x2) + pad, Math.max(y1, y2) + pad];
  }
  return [Math.min(s.x1, s.x2), Math.min(s.y1, s.y2), Math.max(s.x1, s.x2), Math.max(s.y1, s.y2)];
}

/** A printable stitch guide: a cover, then the panel at true size on letter sheets. */
export async function generateSashikoPdf(request: SashikoRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateSashiko(request);
  const runs = sashikoRuns(request);
  const sheets = sashikoSheets(request.width, request.height);

  const doc = await PDFDocument.create();
  const title = sashikoText(locale, "pdfTitle", { motif: result.motif });
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  w.text(title, { size: 22, bold: true });
  w.text(sashikoText(locale, "pdfSize", { w: result.width, h: result.height, spacing: result.spacing, stitch: result.stitch, gap: result.gap }), { muted: true });
  w.text(sashikoText(locale, "pdfCounts", { stitches: result.stitches, y: result.threadYards, sheets: result.sheets, cloth: request.cloth, thread: request.thread }), { muted: true });
  w.gap(10);

  w.text(sashikoText(locale, "pdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));
  w.gap(10);
  w.text(sashikoText(locale, "pdfNote"), { size: 9, muted: true });
  w.gap(10);

  // The whole panel, small and in its colors, with the sheets marked on it.
  const room = Math.max(2 * PT, w.y - MARGIN - 14);
  const scale = Math.min((8.5 * PT - 2 * MARGIN) / request.width, room / request.height, 0.5 * PT);
  const top = w.y;
  const place = (x: number, y: number): [number, number] => [MARGIN + x * scale, top - y * scale];
  w.page.drawRectangle({ x: MARGIN, y: top - request.height * scale, width: request.width * scale, height: request.height * scale, color: color(request.cloth) });
  push(w.page, [
    pushGraphicsState(),
    setStrokingColor(color(request.thread)),
    setLineWidth(0.4),
    ...runs.flatMap((run) => [...strokeOps(run.stroke, place), stroke()]),
    popGraphicsState(),
  ]);
  if (sheets.length > 1) {
    push(w.page, [
      pushGraphicsState(),
      setStrokingColor(rgb(1, 0.2, 0.6)),
      setLineWidth(0.5),
      ...sheets.flatMap((s) => {
        const [x, y] = place(s.x, s.y + s.height);
        return boxOps(x, y, s.width * scale, s.height * scale);
      }),
      popGraphicsState(),
    ]);
  }

  // Sheets: everything from here on is at true size.
  sheets.forEach((sheet, index) => {
    w.newPage();
    const page = w.page;
    page.drawText(sashikoText(locale, "pdfSheet", { n: index + 1, total: sheets.length, row: sheet.row + 1, col: sheet.col + 1 }), { x: MARGIN, y: SHEET_TOP + 7, size: 10, font: bold, color: INK });

    const ops: PDFOperator[] = [pushGraphicsState(), setStrokingColor(FAINT), setLineWidth(0.4), ...boxOps(MARGIN, SHEET_TOP - sheet.height * PT, sheet.width * PT, sheet.height * PT)];

    // Thin lines where the next sheet's area starts, to line it up against.
    if (sheet.x + sheet.width < request.width) {
      const [x] = sheetPoint(sheet, sheet.x + SHEET_WIDTH - 0.5, 0);
      ops.push(moveTo(x, SHEET_TOP), lineTo(x, SHEET_TOP - sheet.height * PT), stroke());
    }
    if (sheet.y + sheet.height < request.height) {
      const [, y] = sheetPoint(sheet, 0, sheet.y + SHEET_HEIGHT - 0.5);
      ops.push(moveTo(MARGIN, y), lineTo(MARGIN + sheet.width * PT, y), stroke());
    }

    // Stitches that straddle the sheet's edge are cut there, and whole on the neighbor.
    ops.push(rectangle(MARGIN, SHEET_TOP - sheet.height * PT, sheet.width * PT, sheet.height * PT), clip(), endPath());
    ops.push(setStrokingColor(INK), setLineWidth(1.1));
    const onSheet = (x: number, y: number) => sheetPoint(sheet, x, y);
    for (const run of runs) {
      for (const dash of run.dashes) {
        const [x0, y0, x1, y1] = bounds(dash);
        if (x1 < sheet.x || x0 > sheet.x + sheet.width || y1 < sheet.y || y0 > sheet.y + sheet.height) continue;
        ops.push(...strokeOps(dash, onSheet), stroke());
      }
    }
    ops.push(popGraphicsState());

    // Drawn last, outside the clip, so it's always whole.
    ops.push(setStrokingColor(INK), setLineWidth(0.75), ...boxOps(CHECK_X, CHECK_Y, PT, PT));
    push(page, ops);
    page.drawText(sashikoText(locale, "pdfInch"), { x: CHECK_X + 14, y: CHECK_Y + PT / 2 - 3, size: 9, font, color: INK });
    let y = CHECK_Y + PT - 10;
    for (const line of [sashikoText(locale, "pdfCheck"), ...(sheets.length > 1 ? [sashikoText(locale, "pdfOverlap")] : [])]) {
      // These stay short enough for one line; the size is a guard for the longest languages.
      const size = Math.min(9, (8.5 * PT - 2 * MARGIN - PT - 12) / (font.widthOfTextAtSize(line, 9) / 9));
      page.drawText(line, { x: CHECK_X + PT + 12, y, size, font, color: INK });
      y -= 14;
    }
  });

  return doc.save();
}
