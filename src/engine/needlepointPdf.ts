import { writeProjectPdf } from "./countedChartPdf";
import { generateNeedlepoint, needlepointText, type NeedlepointRequest } from "./needlepoint";

/** A printable canvas project: picture, yarn, canvas work, blocking and the chart, split over sheets when it's large. */
export async function generateNeedlepointPdf(request: NeedlepointRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const say = (key: Parameters<typeof needlepointText>[1], values: Record<string, string | number> = {}) => needlepointText(locale, key, values);
  const result = generateNeedlepoint(request);
  const used = result.colors.filter((c) => c.stitches > 0);

  return writeProjectPdf({
    title: say("pdfTitle"),
    size: say("pdfSize", { w: result.width, h: result.height, mesh: request.mesh, columns: result.columns, rows: result.rows }),
    ground: request.canvas,
    grid: request.grid,
    colors: request.colors,
    colorsHeading: say("pdfColors"),
    colorLines: used.map((c) => ({ color: c.color, text: say("pdfColor", { symbol: c.symbol, hex: c.color, n: c.stitches, strands: c.strands, y: c.yards, s: c.skeins }) })),
    total: say("pdfTotal", { n: result.stitches, y: result.totalYards }),
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
