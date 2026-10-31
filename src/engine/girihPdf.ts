import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import { generateGirih, GIRIH_UNITS, girihScene, girihSay, girihShapes, girihStencil, usableStar, type GirihRequest, type GirihScene, type GirihShape } from "./girih";
import { Writer } from "./pdf";

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const PT = 72;
const PAGE_WIDTH = 612;
const MARGIN = 36;
const FOOTER = 40;
const WHITE = rgb(1, 1, 1);

const drawPaths = (page: PDFPage, shapes: GirihShape[], x: number, y: number, scale: number) => {
  for (const s of shapes) {
    if (!s.d) continue;
    page.drawSvgPath(s.d, {
      x,
      y,
      scale,
      ...(s.fill ? { color: color(s.fill) } : {}),
      ...(s.stroke ? { borderColor: color(s.stroke), borderWidth: s.strokeWidth ?? 1 } : {}),
    });
  }
};

/** Draws repeats from the top left. Lines reach a little past their repeat, so the seams join; a white band trims the outside. */
function drawRepeats(page: PDFPage, request: GirihRequest, scene: GirihScene, top: number, scale: number, across: number, down: number) {
  const cw = scene.group.cell.width * GIRIH_UNITS * scale;
  const ch = scene.group.cell.height * GIRIH_UNITS * scale;
  const left = (PAGE_WIDTH - cw * across) / 2;
  const shapes = girihShapes(request, scene, true);
  page.drawRectangle({ x: left, y: top - ch * down, width: cw * across, height: ch * down, color: color(request.colors.background) });
  for (let j = 0; j < down; j++) for (let i = 0; i < across; i++) drawPaths(page, shapes.filter((s) => s.fill), left + i * cw, top - j * ch, scale);
  for (let j = 0; j < down; j++) for (let i = 0; i < across; i++) drawPaths(page, shapes.filter((s) => s.stroke), left + i * cw, top - j * ch, scale);
  const band = 8;
  const w = cw * across;
  const h = ch * down;
  for (const [x, y, width, height] of [[left - band, top, w + band * 2, band], [left - band, top - h - band, w + band * 2, band], [left - band, top - h - band, band, h + band * 2], [left + w, top - h - band, band, h + band * 2]]) {
    page.drawRectangle({ x, y, width, height, color: WHITE });
  }
  page.drawRectangle({ x: left, y: top - h, width: w, height: h, borderColor: color(request.colors.line), borderWidth: 1 });
}

/** A printable sheet: the wall panel, one repeat, the stencil, then notes. */
export async function generateGirihPdf(request: GirihRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateGirih(request);
  const star = usableStar(request.symmetry, request.star);
  const scene = girihScene(request.symmetry, star);
  const stencil = girihStencil({ ...request, star });
  const { cell } = scene.group;
  const doc = await PDFDocument.create();
  const title = girihSay(locale, result.isGirih ? "pdfTitleGirih" : "pdfTitleStar", { n: request.symmetry });
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);
  const room = (top: number) => ({ width: PAGE_WIDTH - MARGIN * 2, height: top - FOOTER });

  // The wall panel, as large as the page allows.
  w.text(title, { size: 22, bold: true });
  w.text(girihSay(locale, "pdfSize", { w: result.width, h: result.height, across: request.across, down: request.down, pw: result.panelWidth, ph: result.panelHeight }), { muted: true });
  w.gap(14);
  const panelRoom = room(w.y);
  const panelScale = Math.min(panelRoom.width / (cell.width * GIRIH_UNITS * request.across), panelRoom.height / (cell.height * GIRIH_UNITS * request.down));
  drawRepeats(w.page, request, scene, w.y, panelScale, request.across, request.down);

  // One repeat, at true size when it fits.
  w.newPage();
  w.text(girihSay(locale, "pdfRepeat"), { size: 13, bold: true });
  const trueScale = (request.repeatWidth * PT) / (cell.width * GIRIH_UNITS);
  const repeatRoom = room(w.y - 60);
  const fit = Math.min(repeatRoom.width / (cell.width * GIRIH_UNITS), repeatRoom.height / (cell.height * GIRIH_UNITS));
  const repeatScale = Math.min(trueScale, fit);
  const isTrue = repeatScale === trueScale;
  w.text(isTrue ? girihSay(locale, "pdfTrueSize") : girihSay(locale, "pdfScaled", { percent: Math.round((repeatScale / trueScale) * 100) }), { muted: true });
  if (isTrue) {
    w.gap(4);
    w.page.drawRectangle({ x: MARGIN, y: w.y - PT, width: PT, height: PT, borderColor: rgb(0, 0, 0), borderWidth: 0.75 });
    w.text(girihSay(locale, "pdfInch"), { x: MARGIN + PT + 8, muted: true });
    w.y -= PT;
  }
  w.gap(14);
  drawRepeats(w.page, request, scene, w.y, repeatScale, 1, 1);

  // The stencil: openings in white on the gray sheet, ready to cut along their outlines.
  w.newPage();
  w.text(girihSay(locale, "pdfStencil"), { size: 13, bold: true });
  w.text(girihSay(locale, "pdfStencilHelp", { n: result.openings }), { muted: true });
  w.gap(10);
  const stencilRoom = room(w.y);
  const stencilScale = Math.min(trueScale, stencilRoom.width / (stencil.width * GIRIH_UNITS), stencilRoom.height / (stencil.height * GIRIH_UNITS));
  const sheetW = stencil.width * GIRIH_UNITS * stencilScale;
  const sheetH = stencil.height * GIRIH_UNITS * stencilScale;
  const left = (PAGE_WIDTH - sheetW) / 2;
  w.page.drawRectangle({ x: left, y: w.y - sheetH, width: sheetW, height: sheetH, color: rgb(0.82, 0.82, 0.82), borderColor: rgb(0, 0, 0), borderWidth: 0.75 });
  const path = (points: readonly (readonly [number, number])[]) => `M${points.map(([x, y]) => `${(x * GIRIH_UNITS).toFixed(2)} ${(y * GIRIH_UNITS).toFixed(2)}`).join("L")}Z`;
  const cuts = [...stencil.openings, ...stencil.marks].map(path).join("");
  w.page.drawSvgPath(cuts, { x: left, y: w.y, scale: stencilScale, color: WHITE, borderColor: rgb(0, 0, 0), borderWidth: 0.75 / stencilScale });

  w.newPage();
  w.text(girihSay(locale, "pdfNotes"), { size: 13, bold: true });
  result.notes.forEach((note) => w.text(note));
  w.gap(10);
  w.text(girihSay(locale, "pdfParts"), { size: 13, bold: true });
  result.parts.forEach((part) => w.text(girihSay(locale, "pdfPart", { name: part.name, count: part.count })));
  w.gap(10);
  w.text(girihSay(locale, "pdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));
  return doc.save();
}
