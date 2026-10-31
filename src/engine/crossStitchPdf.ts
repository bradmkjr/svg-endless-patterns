import { writeProjectPdf } from "./countedChartPdf";
import { crossStitchText, generateCrossStitch, type CrossStitchRequest } from "./crossStitch";

/** A printable project: picture, materials, every step and the symbol chart, split over sheets when it's large. */
export async function generateCrossStitchPdf(request: CrossStitchRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const say = (key: Parameters<typeof crossStitchText>[1], values: Record<string, string | number> = {}) => crossStitchText(locale, key, values);
  const result = generateCrossStitch(request);
  const used = result.colors.filter((c) => c.stitches > 0);

  return writeProjectPdf({
    title: say("pdfTitle"),
    size: say("pdfSize", { w: result.width, h: result.height, count: request.count, columns: result.columns, rows: result.rows }),
    ground: request.fabric,
    grid: request.grid,
    colors: request.colors,
    colorsHeading: say("pdfColors"),
    colorLines: used.map((c) => ({ color: c.color, text: say("pdfColor", { symbol: c.symbol, hex: c.color, n: c.stitches, strands: c.strands, y: c.yards, s: c.skeins }) })),
    total: say("pdfTotalFloss", { n: result.stitches, y: result.totalYards }),
    sections: [
      { heading: say("pdfMaterials"), lines: result.materials },
      { heading: say("pdfSteps"), lines: result.steps, numbered: true },
      { heading: say("pdfOrder"), lines: result.order, numbered: true },
      { heading: say("pdfFinishing"), lines: result.finishing, numbered: true },
    ],
    chartHeading: say("pdfChart"),
    chartHelp: say("pdfChartHelp"),
    sheetHelp: say("pdfSheetHelp"),
    sheetTitle: (values) => say("pdfSheet", values),
    key: used.map((c) => `${c.symbol} = ${c.color}`).join("    "),
  });
}
