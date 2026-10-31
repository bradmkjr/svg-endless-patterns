import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import { CANVAS, drawMandala, mandalaSay, type MandalaRequest, type MandalaShape } from "./mandala";
import { Writer } from "./pdf";

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const PAGE_WIDTH = 612;
const MARGIN = 36;
const FOOTER = 40;

/** A circle as two half-circle arcs, which pdf-lib's path drawing accepts. */
const circlePath = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

/** Draws shapes centered in the space left on the page, as large as they fit. */
function drawShapes(page: PDFPage, top: number, shapes: MandalaShape[]) {
  const scale = Math.min((PAGE_WIDTH - MARGIN * 2) / CANVAS, (top - FOOTER) / CANVAS);
  const x = (PAGE_WIDTH - CANVAS * scale) / 2;
  for (const s of shapes) {
    page.drawSvgPath(s.kind === "circle" ? circlePath(s.cx, s.cy, s.r) : s.d, { x, y: top, scale, color: color(s.fill), borderColor: color(s.stroke), borderWidth: s.strokeWidth });
  }
}

/** A printable design: the colored version, then a black-on-white coloring page. */
export async function generateMandalaPdf(request: MandalaRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const drawing = drawMandala(request);
  const doc = await PDFDocument.create();
  const title = mandalaSay(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  w.text(title, { size: 22, bold: true });
  w.text(mandalaSay(locale, "pdfInfo", { n: request.symmetry, rings: drawing.rings.length }), { muted: true });
  w.gap(10);
  drawShapes(w.page, w.y, drawing.art);

  w.newPage();
  w.text(mandalaSay(locale, "pdfColoring"), { size: 13, bold: true });
  w.gap(8);
  drawShapes(w.page, w.y, drawing.coloring);
  return doc.save();
}
