import { BlendMode, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Writer } from "./pdf";
import { CANVAS, generateTieDye, GUIDE_HEIGHT, GUIDE_WIDTH, labelInk, tieDyeGuide, tieDyeLayers, tieDyeSay, type TieDyeRequest } from "./tieDye";

const PAGE_WIDTH = 612;
const MARGIN = 36;
const FOOTER = 40;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A printable project: the design, then the folds, the dye map, the amounts and the steps. */
export async function generateTieDyePdf(request: TieDyeRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateTieDye(request);
  const doc = await PDFDocument.create();
  const title = tieDyeSay(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);
  const say = (key: Parameters<typeof tieDyeSay>[1], values = {}) => tieDyeSay(locale, key, values);

  w.text(title, { size: 22, bold: true });
  w.text(say(`name_${request.technique}`), { muted: true });
  w.text(say("pdfPreview"), { muted: true });
  w.gap(10);

  const scale = Math.min((PAGE_WIDTH - MARGIN * 2) / CANVAS, (w.y - FOOTER) / CANVAS);
  const size = CANVAS * scale;
  const x = (PAGE_WIDTH - size) / 2;
  w.page.drawRectangle({ x, y: w.y - size, width: size, height: size, color: color(request.fabric) });
  for (const layer of tieDyeLayers(request)) w.page.drawSvgPath(layer.d, { x, y: w.y, scale, color: color(layer.fill), blendMode: BlendMode.Multiply });

  w.newPage();
  w.text(say("pdfGuide"), { size: 13, bold: true });
  w.gap(6);
  const guide = tieDyeGuide(request);
  const guideScale = (PAGE_WIDTH - MARGIN * 2) / GUIDE_WIDTH;
  for (const shape of guide.shapes) {
    w.page.drawSvgPath(shape.d, {
      x: MARGIN,
      y: w.y,
      scale: guideScale,
      ...(shape.fill ? { color: color(shape.fill) } : {}),
      ...(shape.stroke ? { borderColor: color(shape.stroke), borderWidth: shape.strokeWidth! * guideScale } : { borderWidth: 0 }),
    });
  }
  for (const label of guide.labels) {
    const ink = labelInk(request.dyes[label.text.charCodeAt(0) - 65]);
    w.page.drawText(label.text, { x: MARGIN + label.x * guideScale - 4, y: w.y - label.y * guideScale - 5, size: 13, font: bold, color: color(ink) });
  }
  w.y -= GUIDE_HEIGHT * guideScale + 12;

  w.text(say("mixHeading", { n: request.garments }), { size: 13, bold: true });
  for (const row of result.mix) w.text(say("mixRow", { letter: row.letter, ounces: row.ounces, teaspoons: row.teaspoons, urea: row.ureaTablespoons }));
  w.text(say("mixNote", { strength: request.strength }), { muted: true });
  w.gap(8);

  const section = (heading: Parameters<typeof tieDyeSay>[1], lines: string[]) => {
    w.text(say(heading), { size: 13, bold: true });
    lines.forEach((line, i) => w.text(`${i + 1}. ${line}`));
    w.gap(8);
  };
  section("safetyHeading", result.steps.safety);
  section("foldHeading", result.steps.fold);
  section("soakHeading", result.steps.soak);
  section("applyHeading", result.steps.apply);
  section("cureHeading", result.steps.cure);
  w.text(say("source"), { muted: true });
  return doc.save();
}
