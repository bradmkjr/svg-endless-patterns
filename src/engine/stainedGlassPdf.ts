import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { Writer } from "./pdf";
import type { Point } from "./pieces";
import { fineInches, generateStainedGlass, glassSay, labelPoint, measure, type StainedGlassLayout, type StainedGlassPiece, type StainedGlassRequest } from "./stainedGlass";

const PT = 72;
const PAGE_W = 8.5 * PT;
const PAGE_H = 11 * PT;
const MARGIN = 0.5 * PT;
const INK = rgb(0.13, 0.12, 0.1);
const MUTED = rgb(0.4, 0.38, 0.34);
const LIGHT = rgb(0.82, 0.82, 0.82);
/** Room at the top of every template sheet for the check square, so scale can be verified on any of them. */
const HEADER = PT + 16;
const LABEL = 14;
/** Where tiled sheets repeat each other, for taping. */
export const OVERLAP = 0.5 * PT;

const color = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** A window onto a piece, in points from its bounding box's top left, drawn with that corner at (x, y) on the page. */
export type Placement = {
  number: number;
  x: number;
  y: number;
  window: { x: number; y: number; w: number; h: number };
  /** Which sheet of a tiled piece this is; `of` is 1 when the piece fits a page. */
  sheet: number;
  of: number;
};

const boxOf = (points: Point[]) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  return { minX, minY, w: (Math.max(...xs) - minX) * PT, h: (Math.max(...ys) - minY) * PT };
};

/** A segment's part inside a window (Liang-Barsky), or null. */
function clipSegment(a: Point, b: Point, win: Placement["window"]): [Point, Point] | null {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  let [t0, t1] = [0, 1];
  const checks: [number, number][] = [[-dx, a[0] - win.x], [dx, win.x + win.w - a[0]], [-dy, a[1] - win.y], [dy, win.y + win.h - a[1]]];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null;
    } else if (p < 0) {
      t0 = Math.max(t0, q / p);
    } else {
      t1 = Math.min(t1, q / p);
    }
  }
  if (t0 >= t1) return null;
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}

/** Whether a point is inside a consistently wound convex polygon. */
function inside(points: Point[], [x, y]: Point): boolean {
  return points.every(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0;
  });
}

/**
 * Lays every piece out at true size, in number order and upright as in the panel, so glass
 * texture keeps its direction. A piece too big for a sheet is tiled: its sheets overlap, and a
 * sheet is only made where the piece's outline actually reaches.
 */
export function planTemplates(pieces: StainedGlassPiece[]): { sheets: Placement[][]; tiled: number[] } {
  const contentW = PAGE_W - 2 * MARGIN;
  const top = MARGIN + HEADER;
  const contentH = PAGE_H - MARGIN - top - LABEL;
  const sheets: Placement[][] = [];
  const tiled: number[] = [];
  let current: Placement[] = [];
  let [x, y, rowH] = [MARGIN, top, 0];
  const nextSheet = () => {
    if (current.length) sheets.push(current);
    current = [];
    [x, y, rowH] = [MARGIN, top, 0];
  };

  for (const piece of pieces) {
    const { minX, minY, w, h } = boxOf(piece.cut);
    if (w <= contentW && h <= contentH) {
      const itemW = Math.max(w, 72);
      if (x + itemW > PAGE_W - MARGIN) {
        x = MARGIN;
        y += rowH;
        rowH = 0;
      }
      if (y + h + LABEL > PAGE_H - MARGIN) nextSheet();
      current.push({ number: piece.number, x, y, window: { x: 0, y: 0, w, h }, sheet: 1, of: 1 });
      x += itemW + 14;
      rowH = Math.max(rowH, h + LABEL + 8);
      continue;
    }
    nextSheet();
    tiled.push(piece.number);
    const stepX = contentW - OVERLAP;
    const stepY = contentH - OVERLAP;
    const local = piece.cut.map(([px, py]): Point => [(px - minX) * PT, (py - minY) * PT]);
    const windows: Placement["window"][] = [];
    for (let row = 0; row * stepY < h; row++) {
      for (let col = 0; col * stepX < w; col++) {
        const window = { x: col * stepX, y: row * stepY, w: contentW, h: contentH };
        const reached = local.some((p, i) => clipSegment(p, local[(i + 1) % local.length], window));
        // A sheet wholly inside the piece has no outline but still carries the crosses that join its neighbors.
        if (reached || inside(local, [window.x + window.w / 2, window.y + window.h / 2])) windows.push(window);
      }
    }
    windows.forEach((window, i) => {
      sheets.push([{ number: piece.number, x: MARGIN, y: top + LABEL, window, sheet: i + 1, of: windows.length }]);
    });
  }
  if (current.length) sheets.push(current);
  return { sheets, tiled };
}

function drawOutline(page: PDFPage, points: Point[], place: Placement, thickness: number, ink: ReturnType<typeof rgb>, dashed = false) {
  points.forEach((p, i) => {
    const part = clipSegment(p, points[(i + 1) % points.length], place.window);
    if (!part) return;
    const flip = ([px, py]: Point) => ({ x: place.x + px - place.window.x, y: PAGE_H - (place.y + py - place.window.y) });
    page.drawLine({ start: flip(part[0]), end: flip(part[1]), thickness, color: ink, ...(dashed ? { dashArray: [4, 3] } : {}) });
  });
}

function checkHeader(page: PDFPage, font: PDFFont, bold: PDFFont, heading: string, help: string, inch: string) {
  const top = PAGE_H - MARGIN;
  page.drawRectangle({ x: MARGIN, y: top - PT, width: PT, height: PT, borderColor: INK, borderWidth: 0.75 });
  page.drawText(inch, { x: MARGIN + 8, y: top - PT / 2 - 3, size: 9, font, color: INK });
  page.drawText(heading, { x: MARGIN + PT + 12, y: top - 12, size: 13, font: bold, color: INK });
  // Wrapped by hand: this text sits beside the square, not in the Writer's flow.
  const width = PAGE_W - 2 * MARGIN - PT - 12;
  let line = "";
  let y = top - 28;
  for (const word of help.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, 9) > width && line) {
      page.drawText(line, { x: MARGIN + PT + 12, y, size: 9, font, color: MUTED });
      y -= 12;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) page.drawText(line, { x: MARGIN + PT + 12, y, size: 9, font, color: MUTED });
}

const LAYOUT_KEYS = { rose: "layoutRose", quarries: "layoutQuarries", medallion: "layoutMedallion", sunburst: "layoutSunburst" } as const satisfies Record<StainedGlassLayout, string>;

/** A printable cutting pattern: numbered key, estimate, rules, then true-size templates. */
export async function generateStainedGlassPdf(request: StainedGlassRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateStainedGlass(request);
  const doc = await PDFDocument.create();
  doc.setTitle(glassSay(locale, "pdfTitle"));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, glassSay(locale, "pdfFooter"));
  const byNumber = new Map(result.pieces.map((p) => [p.number, p]));

  w.text(glassSay(locale, "pdfTitle"), { size: 20, bold: true });
  w.text(glassSay(locale, "pdfSub", { layout: glassSay(locale, LAYOUT_KEYS[result.layout]), w: result.width, h: result.height, n: result.pieces.length, face: fineInches(request.cameWidth), heart: fineInches(request.heartWidth) }), { muted: true });
  w.gap(8);
  if (result.notes.length) {
    w.text(glassSay(locale, "pdfNotes"), { size: 13, bold: true });
    for (const note of result.notes) w.text(note);
    w.gap(8);
  }

  // The key is only a map, so it's scaled to the page and says so; the true-size shapes are the templates.
  w.text(glassSay(locale, "pdfKey"), { size: 13, bold: true });
  const scale = Math.min((PAGE_W - 2 * MARGIN) / result.width, (w.y - MARGIN - 8) / result.height);
  for (const piece of result.pieces) {
    const path = `M ${piece.line.map(([x, y]) => `${(x * scale).toFixed(2)} ${(y * scale).toFixed(2)}`).join(" L ")} Z`;
    w.page.drawSvgPath(path, { x: MARGIN, y: w.y, color: color(request.colors[piece.color]), opacity: 0.35, borderColor: INK, borderWidth: 0.6 });
    const [lx, ly] = labelPoint(piece.line);
    const size = Math.max(5, Math.min(11, measure(piece.line).width * scale * 0.4));
    const label = String(piece.number);
    w.page.drawText(label, { x: MARGIN + lx * scale - font.widthOfTextAtSize(label, size) / 2, y: w.y - ly * scale - size * 0.35, size, font, color: INK });
  }

  w.newPage();
  w.text(glassSay(locale, "pdfGlass"), { size: 13, bold: true });
  w.text(glassSay(locale, "pdfGlassHelp", { waste: result.wastePercent }), { muted: true, size: 9 });
  w.gap(4);
  for (const c of result.colors) {
    if (!c.pieces) continue;
    w.ensure(16);
    w.page.drawRectangle({ x: MARGIN, y: w.y - 11, width: 11, height: 11, color: color(c.color), borderColor: MUTED, borderWidth: 0.5 });
    w.text(glassSay(locale, "pdfGlassRow", { letter: c.letter, hex: c.color, pieces: c.pieces, cut: c.cutArea, need: c.needed, ft: c.squareFeet, largest: c.largest }), { x: MARGIN + 18 });
  }
  w.text(glassSay(locale, "pdfCame", { inner: result.came.innerFeet, outer: result.came.perimeterFeet }));
  w.gap(10);
  w.text(glassSay(locale, "pdfRules"), { size: 13, bold: true });
  for (const rule of result.rules) w.text(`- ${rule}`);
  w.gap(10);
  w.text(glassSay(locale, "pdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));
  w.gap(10);

  const { sheets, tiled } = planTemplates(result.pieces);
  w.text(tiled.length ? glassSay(locale, "pdfTiled", { list: tiled.join(", ") }) : glassSay(locale, "pdfNoTiled"), { bold: true });

  for (const sheet of sheets) {
    w.newPage();
    const help = glassSay(locale, "pdfTemplateHelp") + (sheet[0].of > 1 ? ` ${glassSay(locale, "pdfTiledHelp")}` : "");
    checkHeader(w.page, font, bold, glassSay(locale, "pdfTemplates"), help, glassSay(locale, "pdfCheck"));
    for (const place of sheet) {
      const piece = byNumber.get(place.number)!;
      const { minX, minY, h } = boxOf(piece.cut);
      const local = (points: Point[]) => points.map(([x, y]): Point => [(x - minX) * PT, (y - minY) * PT]);
      drawOutline(w.page, local(piece.sight), place, 0.5, MUTED, true);
      drawOutline(w.page, local(piece.cut), place, 0.9, INK);
      const [lx, ly] = local([labelPoint(piece.cut)])[0];
      if (place.of === 1) {
        const label = String(piece.number);
        const size = Math.min(14, Math.max(8, measure(piece.cut).width * PT * 0.3));
        w.page.drawText(label, { x: place.x + lx - bold.widthOfTextAtSize(label, size) / 2, y: PAGE_H - place.y - ly - size * 0.35, size, font: bold, color: INK });
        w.page.drawText(glassSay(locale, "pdfPiece", { n: piece.number, letter: piece.letter }), { x: place.x, y: PAGE_H - place.y - h - 10, size: 8, font, color: MUTED });
      } else {
        const win = place.window;
        w.page.drawText(glassSay(locale, "pdfSheet", { n: piece.number, letter: piece.letter, sheet: place.sheet, of: place.of }), { x: MARGIN, y: PAGE_H - place.y + 4, size: 9, font: bold, color: INK });
        // Overlap bands, and crosses at fixed spots in the piece's own coordinates, so sheets line up.
        const band = (x: number, y: number, width: number, height: number) =>
          w.page.drawRectangle({ x: place.x + x, y: PAGE_H - place.y - y - height, width, height, color: LIGHT, opacity: 0.35 });
        band(win.w - OVERLAP, 0, OVERLAP, win.h);
        band(0, win.h - OVERLAP, win.w, OVERLAP);
        if (win.x > 0) band(0, 0, OVERLAP, win.h);
        if (win.y > 0) band(0, 0, win.w, OVERLAP);
        const stepX = win.w - OVERLAP;
        const stepY = win.h - OVERLAP;
        for (const gx of [win.x + OVERLAP / 2, win.x + stepX + OVERLAP / 2]) {
          for (const gy of [win.y + OVERLAP / 2, win.y + stepY + OVERLAP / 2]) {
            const [cx, cy] = [place.x + gx - win.x, PAGE_H - (place.y + gy - win.y)];
            w.page.drawLine({ start: { x: cx - 6, y: cy }, end: { x: cx + 6, y: cy }, thickness: 0.6, color: INK });
            w.page.drawLine({ start: { x: cx, y: cy - 6 }, end: { x: cx, y: cy + 6 }, thickness: 0.6, color: INK });
          }
        }
      }
    }
  }
  return doc.save();
}
