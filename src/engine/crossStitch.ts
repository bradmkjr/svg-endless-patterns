import { cellColor, chartCenter, chartSheets, chartSvg, countStitches, cropGrid, makingUp, skeinsFor, SHEET_OVERLAP, stitchedSvg, stitchingOrder, SYMBOLS, type CountedFinish, type StitchTurn } from "./countedChart";
import { approxInches, ceilToEighth, inches } from "./format";
import type { Locale } from "./i18n";
import catalog from "./messages/crossStitch.json";

export { cellColor, countStitches, cropGrid, SYMBOLS } from "./countedChart";

/**
 * A cross-stitch design. Each string in `grid` is a row, read left to right:
 * "." is bare fabric, and "a" to "h" are `colors[0]` to `colors[7]`.
 */
export type CrossStitchRequest = {
  grid: string[];
  /** Plain colors the stitcher chooses, not matched to any thread brand. */
  colors: string[];
  /** The fabric, for the preview only. */
  fabric: string;
  /** Stitches per inch: the Aida count. */
  count: number;
  /** Strands of six-strand floss in the needle. */
  strands: number;
  /** Bare fabric to leave on every side, in inches. */
  margin: number;
  finish: CountedFinish;
  locale?: Locale;
};

export type CrossStitchColor = { symbol: string; color: string; stitches: number; yards: number; strands: number; skeins: number };

export type CrossStitchResult = {
  svg: { stitched: string; chart: string };
  /** The stitched area, leaving out bare rows and columns around the design. */
  columns: number;
  rows: number;
  stitches: number;
  widthInches: number;
  heightInches: number;
  width: string;
  height: string;
  fabricWidth: string;
  fabricHeight: string;
  colors: CrossStitchColor[];
  totalYards: number;
  totalSkeins: number;
  /** Everything to gather first. */
  materials: string[];
  /** Cutting, marking and stitching. */
  steps: string[];
  /** Colors in the order to stitch them, as lines and as data. */
  order: string[];
  turns: StitchTurn[];
  /** Washing and making up. */
  finishing: string[];
  /** Sheets the PDF chart takes. */
  sheets: number;
};

/** Extra for starting, ending and traveling between stitches. */
const ALLOWANCE = 1.25;
/** A usual skein of six-strand floss holds a little over this; a round figure keeps the estimate safe. */
export const YARDS_PER_SKEIN = 8;

/** A full cross, in fabric squares: two diagonals on the front, two straight legs on the back. */
const CROSS_PATH = 2 * Math.SQRT2 + 2;

/** The usual tapestry needle for each count. */
const NEEDLES: Record<number, number> = { 11: 22, 14: 24, 16: 26, 18: 26, 22: 28 };

type EngineText = keyof typeof catalog.en;

/** Generated text for this tool, with its {placeholders} filled in. */
export function crossStitchText(locale: Locale, key: EngineText, values: Record<string, string | number> = {}): string {
  return catalog[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** Length of six-strand floss for one color, from the path a stitch takes through the fabric, split to the strands in use. */
export function threadYards(stitches: number, req: Pick<CrossStitchRequest, "count" | "strands">): number {
  const perStitch = (CROSS_PATH * (req.strands / 6)) / req.count;
  return Math.ceil(((stitches * perStitch * ALLOWANCE) / 36) * 10) / 10;
}

function stitchMarks(req: CrossStitchRequest, grid: string[]): string {
  // One path per color: each cell is its two crossing legs.
  return req.colors
    .map((color, c) => {
      let d = "";
      grid.forEach((row, y) => {
        [...row].forEach((cell, x) => {
          if (cellColor(cell) === c) d += `M${x} ${y}l1 1M${x + 1} ${y}l-1 1`;
        });
      });
      return d ? `<path d="${d}" stroke="${color}"/>` : "";
    })
    .join("");
}

export function generateCrossStitch(req: CrossStitchRequest): CrossStitchResult {
  const locale = req.locale ?? "en";
  const say = (key: EngineText, values: Record<string, string | number> = {}) => crossStitchText(locale, key, values);
  const counts = countStitches(req.grid, req.colors.length);
  const stitches = counts.reduce((sum, n) => sum + n, 0);
  const cropped = cropGrid(req.grid);
  const columns = stitches ? cropped[0].length : 0;
  const rows = stitches ? cropped.length : 0;
  const widthInches = columns / req.count;
  const heightInches = rows / req.count;
  const colors = req.colors.map((color, i) => {
    const yards = threadYards(counts[i], req);
    return { symbol: SYMBOLS[i], color, stitches: counts[i], yards, strands: req.strands, skeins: skeinsFor(yards, YARDS_PER_SKEIN) };
  });
  const width = approxInches(widthInches);
  const height = approxInches(heightInches);
  const fabricWidth = inches(ceilToEighth(widthInches + 2 * req.margin));
  const fabricHeight = inches(ceilToEighth(heightInches + 2 * req.margin));
  const center = chartCenter(columns, rows);
  const turns = stitchingOrder(cropped, req.colors);
  const sheets = stitches ? chartSheets(columns, rows).length : 1;
  // Added up to one decimal, since floats would otherwise show 0.30000000000000004.
  const totalYards = Math.round(colors.reduce((sum, c) => sum + c.yards, 0) * 10) / 10;
  const totalSkeins = colors.reduce((sum, c) => sum + c.skeins, 0);
  const used = colors.filter((c) => c.stitches > 0).length;
  // An inch of bare fabric frames the design, unless the margin needs it all for folding over the board.
  const frameSpace = req.margin >= 2 ? 1 : 0.5;
  const made = makingUp(widthInches, heightInches, req.margin, frameSpace, 0.5);
  const framed = req.finish === "frame";

  return {
    svg: {
      stitched: stitchedSvg(cropped[0]?.length ?? 0, cropped.length, req.count, req.fabric, say("svgStitched"), 0.34, stitchMarks(req, cropped)),
      chart: chartSvg(cropped, say("svgChart")),
    },
    columns,
    rows,
    stitches,
    widthInches,
    heightInches,
    width,
    height,
    fabricWidth,
    fabricHeight,
    colors,
    totalYards,
    totalSkeins,
    materials: [
      say("materialFabric", { count: req.count, fw: fabricWidth, fh: fabricHeight }),
      say("materialFloss", { y: totalYards, n: used, s: totalSkeins, per: YARDS_PER_SKEIN }),
      say("materialNeedle", { size: NEEDLES[req.count] ?? 24 }),
      framed ? say("materialFrame", { bw: made.boardWidth, bh: made.boardHeight }) : say("materialPillow", { bw: made.backWidth, bh: made.backHeight, sw: made.strip, fw: made.formWidth, fh: made.formHeight }),
    ],
    steps: [
      say("stepCut", { fw: fabricWidth, fh: fabricHeight, w: width, h: height, m: req.margin }),
      say("stepCenter", { cx: center.column, cy: center.row }),
      say(req.strands === 1 ? "stepCrossOne" : "stepCrossMany", { count: req.count, strands: req.strands }),
      say("stepOrder"),
      say("stepTension"),
      ...(sheets > 1 ? [say("stepSheets", { n: sheets, o: SHEET_OVERLAP })] : []),
    ],
    order: turns.map((turn) => say("orderLine", { symbol: turn.symbol, hex: turn.color, n: turn.stitches, c: turn.column, r: turn.row })),
    turns,
    finishing: [
      say("stepWash"),
      ...(framed
        ? [say("stepFrameBoard", { bw: made.boardWidth, bh: made.boardHeight, space: frameSpace }), say("stepFrameLace", { wrap: made.wrap }), say("stepFrameFit", { bw: made.boardWidth, bh: made.boardHeight })]
        : [
            say("stepPillowTrim", { tw: made.trimWidth, th: made.trimHeight }),
            say("stepPillowBorder", { sw: made.strip, side: made.sideStrip, top: made.topStrip }),
            say("stepPillowBack", { bw: made.backWidth, bh: made.backHeight }),
            say("stepPillowForm", { pw: made.pillowWidth, ph: made.pillowHeight, fw: made.formWidth, fh: made.formHeight }),
          ]),
    ],
    sheets,
  };
}
