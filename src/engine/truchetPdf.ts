import {
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  fill,
  fillAndStroke,
  LineCapStyle,
  LineJoinStyle,
  lineTo,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  setFillingColor,
  setLineCap,
  setLineJoin,
  setLineWidth,
  setStrokingColor,
  StandardFonts,
  stroke,
  type PDFOperator,
} from "pdf-lib";
import { Writer } from "./pdf";
import { generateTruchet, HAIRLINE, TILE_UNITS, tileShape, truchetPaintOrder, truchetText, type TruchetPaint, type TruchetRequest } from "./truchet";

const PT = 72;
const MARGIN = 36;
const SHEET_WIDTH = 7.5;
/** Room under the sheet's heading, in inches. */
const SHEET_HEIGHT = 9.5;
/** A cubic this far along a quarter circle's tangents is far closer than a printer can show. */
const ARC = 0.5523;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** One tile's path, as operators. Written directly in page space, so the repeat prints at true size. */
function tileOps(tile: TruchetPaint, req: TruchetRequest, x: number, top: number, scale: number): PDFOperator[] {
  const place = (px: number, py: number): [number, number] => [x + (tile.col * TILE_UNITS + px) * scale, top - (tile.row * TILE_UNITS + py) * scale];
  const shape = tileShape(req.style, tile.orient);
  if (shape.fill) {
    const [first, ...rest] = shape.fill;
    return [moveTo(...place(...first)), ...rest.map((p) => lineTo(...place(...p))), closePath(), fillAndStroke()];
  }
  return shape.pieces.flatMap(({ from, to, center }) => {
    const ops = [moveTo(...place(...from))];
    if (!center) ops.push(lineTo(...place(...to)));
    else {
      // The tangents at the two ends meet at the corner opposite the center.
      const cx = from[0] + to[0] - center[0];
      const cy = from[1] + to[1] - center[1];
      const c1 = place(from[0] + (cx - from[0]) * ARC, from[1] + (cy - from[1]) * ARC);
      const c2 = place(to[0] + (cx - to[0]) * ARC, to[1] + (cy - to[1]) * ARC);
      ops.push(appendBezierCurve(...c1, ...c2, ...place(...to)));
    }
    ops.push(stroke());
    return ops;
  });
}

/** One repeat, clipped to its square exactly as the SVG is clipped to its viewBox. */
function repeatOps(req: TruchetRequest, x: number, top: number): PDFOperator[] {
  const size = req.repeatWidth * PT;
  const scale = size / (req.grid * TILE_UNITS);
  const filled = req.style === "triangles";
  const tiles = truchetPaintOrder(req);
  const pass = (accent: boolean, hex: string) => [
    setStrokingColor(color(hex)),
    setFillingColor(color(hex)),
    ...tiles.filter((t) => t.accent === accent).flatMap((t) => tileOps(t, req, x, top, scale)),
  ];
  return [
    pushGraphicsState(),
    rectangle(x, top - size, size, size),
    clip(),
    endPath(),
    setFillingColor(color(req.colors.background)),
    rectangle(x, top - size, size, size),
    fill(),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    setLineWidth((filled ? HAIRLINE : req.weight) * scale),
    ...pass(false, req.colors.line),
    ...pass(true, req.colors.accent),
    popGraphicsState(),
  ];
}

/** A printable sheet: one repeat at true size with its settings, then a full page of repeats. */
export async function generateTruchetPdf(request: TruchetRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateTruchet(request);
  const doc = await PDFDocument.create();
  const title = truchetText(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);
  const size = request.repeatWidth * PT;

  w.text(title, { size: 22, bold: true });
  w.text(truchetText(locale, "pdfSub", { style: result.style, arrangement: result.arrangement, grid: request.grid, tiles: result.tiles }), { muted: true });
  if (result.seeded) w.text(truchetText(locale, "pdfSeed", { seed: request.seed }), { muted: true });
  w.gap(10);

  w.text(truchetText(locale, "pdfRepeat", { repeat: result.repeat }), { size: 13, bold: true });
  w.gap(4);
  w.ensure(size);
  w.page.pushOperators(...repeatOps(request, MARGIN, w.y));
  w.y -= size + 14;

  w.text(truchetText(locale, "pdfPrint"));
  w.text(truchetText(locale, "pdfJoin"));

  w.newPage();
  w.text(truchetText(locale, "pdfSheet"), { size: 13, bold: true });
  w.gap(4);
  const across = Math.floor(SHEET_WIDTH / request.repeatWidth);
  const down = Math.floor(SHEET_HEIGHT / request.repeatWidth);
  for (let row = 0; row < down; row++) {
    for (let col = 0; col < across; col++) w.page.pushOperators(...repeatOps(request, MARGIN + col * size, w.y - row * size));
  }
  return doc.save();
}
