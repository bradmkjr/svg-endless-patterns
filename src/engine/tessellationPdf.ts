import { clip, endPath, PDFDocument, popGraphicsState, pushGraphicsState, rectangle, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import { Writer } from "./pdf";
import { contrastInk, generateTessellation, MOTIFS, tessellationPlacements, tessellationSay as say, type Placement, type TessellationRequest } from "./tessellation";
import { applyAffine, wallpaperGroup, type Vec } from "./wallpaper";

const PT = 72;
const MARGIN = 0.5 * PT;
const PRINTABLE_W = 7.5 * PT;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const pathOf = (points: readonly Vec[], scale: number, dx: number, dy: number) => `M ${points.map(([x, y]) => `${(x * scale + dx).toFixed(2)} ${(y * scale + dy).toFixed(2)}`).join(" L ")} Z`;

type Area = { x: number; top: number; width: number; height: number };

/** Draws repeats inside a rectangle, clipped to it, with `scale` points per lattice unit. */
function drawRepeats(page: PDFPage, request: TessellationRequest, placements: Placement[], area: Area, across: number, down: number, scale: number) {
  const group = wallpaperGroup(request.group);
  const { x, top, width, height } = area;
  const cw = group.cell.width * scale;
  const ch = group.cell.height * scale;
  page.drawRectangle({ x, y: top - height, width, height, color: color(request.colors.background) });
  page.pushOperators(pushGraphicsState(), rectangle(x, top - height, width, height), clip(), endPath());
  for (let row = 0; row < down; row++) {
    for (let col = 0; col < across; col++) {
      for (const { transform, domain } of placements) {
        for (const shape of MOTIFS[request.motif]) {
          const fill = color(shape.role === "primary" ? request.colors.primary : request.colors.accent);
          page.drawSvgPath(pathOf(shape.points.map((p) => applyAffine(transform, p)), scale, col * cw, row * ch), { x, y: top, color: fill });
        }
        if (request.outlines) {
          page.drawSvgPath(pathOf(domain, scale, col * cw, row * ch), { x, y: top, borderColor: color(request.colors.accent), borderWidth: 0.4, borderOpacity: 0.6 });
        }
      }
    }
  }
  page.pushOperators(popGraphicsState());
}

/** A printable sheet: the tile layout, how it's built, and one repeat at true size. */
export async function generateTessellationPdf(request: TessellationRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateTessellation(request);
  const group = wallpaperGroup(request.group);
  const placements = tessellationPlacements(request.group, request.motif);
  const ink = contrastInk(request.colors.background) === "#000000" ? rgb(0, 0, 0) : rgb(1, 1, 1);

  const doc = await PDFDocument.create();
  const title = say(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, say(locale, "pdfFooter", { group: request.group, motif: result.motif }));

  w.text(title, { size: 22, bold: true });
  w.text(say(locale, "pdfSub", { group: request.group, description: result.group.description, motif: result.motif }), { muted: true });
  w.text(say(locale, "pdfSize", { w: result.width, h: result.height, across: request.across, down: request.down, lw: result.layoutWidth, lh: result.layoutHeight }), { muted: true });
  w.gap(10);

  // The layout, scaled to fit what's left of the first page's top half.
  w.text(say(locale, "pdfLayout"), { size: 13, bold: true });
  w.text(say(locale, "pdfLayoutHelp"), { muted: true, size: 9 });
  w.gap(4);
  const fullW = group.cell.width * request.across;
  const fullH = group.cell.height * request.down;
  const layoutScale = Math.min(PRINTABLE_W / fullW, (5 * PT) / fullH);
  const area: Area = { x: MARGIN, top: w.y, width: fullW * layoutScale, height: fullH * layoutScale };
  w.ensure(area.height);
  area.top = w.y;
  drawRepeats(w.page, request, placements, area, request.across, request.down, layoutScale);
  for (let i = 0; i <= request.across; i++) {
    const x = MARGIN + i * group.cell.width * layoutScale;
    w.page.drawLine({ start: { x, y: area.top }, end: { x, y: area.top - area.height }, color: ink, thickness: 0.5, opacity: 0.55, dashArray: [3, 3] });
  }
  for (let i = 0; i <= request.down; i++) {
    const y = area.top - i * group.cell.height * layoutScale;
    w.page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + area.width, y }, color: ink, thickness: 0.5, opacity: 0.55, dashArray: [3, 3] });
  }
  w.page.drawSvgPath(pathOf(group.domain, layoutScale, 0, 0), { x: MARGIN, y: area.top, borderColor: ink, borderWidth: 1 });
  w.y -= area.height + 14;

  w.text(say(locale, "pdfSymmetry"), { size: 13, bold: true });
  result.symmetry.forEach((line) => w.text(line));
  w.gap(8);

  w.text(say(locale, "pdfColors"), { size: 13, bold: true });
  const swatches = [
    [say(locale, "pdfBackground"), request.colors.background],
    [say(locale, "pdfPrimary"), request.colors.primary],
    [say(locale, "pdfAccent"), request.colors.accent],
  ];
  for (const [name, hex] of swatches) {
    w.ensure(16);
    w.page.drawRectangle({ x: MARGIN, y: w.y - 11, width: 11, height: 11, color: color(hex), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 0.5 });
    w.text(`${name}: ${hex}`, { x: MARGIN + 18 });
  }
  w.gap(8);

  w.text(say(locale, "pdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));

  // One repeat, at true size when it fits on the page.
  w.newPage();
  w.text(say(locale, "pdfRepeat"), { size: 13, bold: true });
  const fullScale = (request.repeatWidth * PT) / group.cell.width;
  const fits = Math.min(1, PRINTABLE_W / (group.cell.width * fullScale), (8 * PT) / (group.cell.height * fullScale));
  const scale = fullScale * fits;
  w.text(fits === 1 ? say(locale, "pdfRepeatTrue") : say(locale, "pdfRepeatScaled", { percent: Math.floor(fits * 100) }), { muted: true, size: 9 });
  w.gap(6);
  const tile: Area = { x: MARGIN, top: w.y, width: group.cell.width * scale, height: group.cell.height * scale };
  drawRepeats(w.page, request, placements, tile, 1, 1, scale);
  w.y -= tile.height + 10;
  if (fits === 1) {
    w.ensure(PT + 4);
    w.page.drawRectangle({ x: MARGIN, y: w.y - PT, width: PT, height: PT, borderColor: rgb(0.13, 0.12, 0.1), borderWidth: 0.75 });
    w.page.drawText(say(locale, "pdfInch"), { x: MARGIN + 8, y: w.y - PT / 2 - 3, size: 9, font, color: rgb(0.13, 0.12, 0.1) });
  }
  return doc.save();
}
