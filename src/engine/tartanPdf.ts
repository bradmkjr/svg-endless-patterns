import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { say } from "./i18n";
import { Writer } from "./pdf";
import { generateTartan, type TartanRequest } from "./tartan";

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A printable weaving guide. */
export async function generateTartanPdf(request: TartanRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateTartan(request);
  const doc = await PDFDocument.create();
  const title = say(locale, "taPdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  w.text(title, { size: 22, bold: true });
  w.text(say(locale, "taPdfSize", { w: result.width, h: result.length, tpi: request.threadsPerInch, threads: result.threads, repeat: result.repeat }), { muted: true });
  w.gap(10);

  w.text(say(locale, "taPdfSteps"), { size: 13, bold: true });
  result.steps.forEach((step, i) => w.text(`${i + 1}. ${step}`));
  w.gap(10);

  w.text(say(locale, "taPdfYarn"), { size: 13, bold: true });
  for (const c of result.colors) {
    w.ensure(16);
    w.page.drawRectangle({ x: 36, y: w.y - 11, width: 11, height: 11, color: color(c.color), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 0.5 });
    w.text(say(locale, "taPdfColor", { letter: c.letter, hex: c.color, ends: c.warpEnds, picks: c.weftPicks, y: c.yards }), { x: 54 });
  }
  w.text(say(locale, "taPdfTotal", { y: result.totalYards }), { muted: true });
  return doc.save();
}
