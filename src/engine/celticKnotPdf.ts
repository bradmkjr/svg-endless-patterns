import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import { drawKnot, generateCelticKnot, knotSay, traceKnot, type CelticKnotRequest, type KnotShape } from "./celticKnot";
import { Writer } from "./pdf";

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const PAGE_WIDTH = 612;
const MARGIN = 36;
const FOOTER = 40;

/** Draws shapes centered in the space left on the page, as large as they fit. */
function drawShapes(page: PDFPage, top: number, shapes: KnotShape[], width: number, height: number) {
  const scale = Math.min((PAGE_WIDTH - MARGIN * 2) / width, (top - FOOTER) / height);
  const x = (PAGE_WIDTH - width * scale) / 2;
  for (const s of shapes) {
    page.drawSvgPath(s.d, {
      x,
      y: top,
      scale,
      ...(s.fill ? { color: color(s.fill) } : {}),
      ...(s.stroke ? { borderColor: color(s.stroke), borderWidth: s.strokeWidth ?? 1 } : {}),
    });
  }
}

/** A printable design: the colored knot with its details, then a coloring page and a stencil page. */
export async function generateCelticKnotPdf(request: CelticKnotRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateCelticKnot(request);
  const drawing = drawKnot(request, traceKnot(request).traced);
  const doc = await PDFDocument.create();
  const title = knotSay(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  w.text(title, { size: 22, bold: true });
  w.text(knotSay(locale, "pdfInfo", { cols: request.cols, rows: request.rows, strands: result.strands, crossings: result.crossings, breaks: result.breaks }), { muted: true });
  w.gap(10);
  // A square knot takes most of the page, so the notes go on a page of their own after the drawings.
  drawShapes(w.page, w.y, drawing.art, drawing.width, drawing.height);

  for (const [heading, shapes] of [["pdfColoring", drawing.coloring], ["pdfStencil", drawing.stencil]] as const) {
    w.newPage();
    w.text(knotSay(locale, heading), { size: 13, bold: true });
    w.gap(8);
    drawShapes(w.page, w.y, shapes, drawing.width, drawing.height);
  }

  w.newPage();
  w.text(knotSay(locale, "pdfNotes"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));
  return doc.save();
}
