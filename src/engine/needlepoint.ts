import { cellColor, chartCenter, chartSheets, chartSvg, countStitches, cropGrid, makingUp, skeinsFor, SHEET_OVERLAP, stitchedSvg, stitchingOrder, SYMBOLS, type CountedFinish, type StitchTurn } from "./countedChart";
import { approxInches, ceilToEighth, inches } from "./format";
import type { Locale } from "./i18n";
import catalog from "./messages/needlepoint.json";

/** The three ways to work the same slanted stitch: they look alike and differ on the back. */
export type NeedlepointStitch = "tent" | "continental" | "basketweave";
export type NeedlepointYarn = "tapestry" | "persian";

/**
 * A needlepoint design, using the same rows of letters as cross stitch:
 * "." is bare canvas, and "a" to "h" are `colors[0]` to `colors[7]`.
 */
export type NeedlepointRequest = {
  grid: string[];
  /** Plain colors the stitcher chooses, not matched to any yarn brand. */
  colors: string[];
  /** The canvas, for the preview only. */
  canvas: string;
  /** Canvas threads per inch. */
  mesh: number;
  stitch: NeedlepointStitch;
  yarn: NeedlepointYarn;
  /** Unworked canvas on every side, for blocking and finishing, in inches. */
  margin: number;
  finish: CountedFinish;
  locale?: Locale;
};

export type NeedlepointColor = { symbol: string; color: string; stitches: number; yards: number; strands: number; skeins: number };

export type NeedlepointResult = {
  svg: { stitched: string; chart: string };
  /** The stitched area, leaving out bare rows and columns around the design. */
  columns: number;
  rows: number;
  stitches: number;
  /** Squares inside the design with no color. Needlepoint normally covers all its canvas. */
  bareStitches: number;
  widthInches: number;
  heightInches: number;
  width: string;
  height: string;
  canvasWidth: string;
  canvasHeight: string;
  colors: NeedlepointColor[];
  totalYards: number;
  totalSkeins: number;
  /** Strands of this yarn in the needle on this mesh. */
  strands: number;
  /** Everything to gather first. */
  materials: string[];
  /** Cutting, marking and working the canvas. */
  steps: string[];
  /** Colors in the order to work them, background last, as lines and as data. */
  order: string[];
  turns: StitchTurn[];
  /** Blocking and making up. */
  finishing: string[];
  /** Sheets the PDF chart takes. */
  sheets: number;
};

const DIAGONAL = Math.SQRT2;
/** Yarn per stitch, in canvas threads: the same diagonal on the front, and a different path on the back. */
const STITCH_PATH: Record<NeedlepointStitch, number> = {
  // Half cross: a short straight stitch on the back. Thriftiest, and the back stays thin.
  tent: DIAGONAL + 1,
  // Straight along two threads on the back, woven by the diagonal rows.
  basketweave: DIAGONAL + 2,
  // A long slant on the back.
  continental: DIAGONAL + Math.sqrt(5),
};
/** Extra for starting, ending, and lengths too worn to finish. Wool wears, so it's more than for floss. */
const ALLOWANCE = 1.35;
/** A round figure for a small skein. Persian yarn is sold by three-strand lengths. */
export const YARDS_PER_SKEIN = 8;
const PERSIAN_PLY = 3;

/** Persian strands that cover each mesh. Tapestry wool always goes in as one strand. */
const PERSIAN_STRANDS: Record<number, number> = { 10: 3, 12: 3, 13: 2, 14: 2, 18: 1 };
/** The usual tapestry needle for each mesh. */
const NEEDLES: Record<number, number> = { 10: 18, 12: 18, 13: 20, 14: 20, 18: 22 };

/** Tapestry wool is too thick to pass cleanly through a canvas finer than this. */
const TAPESTRY_FINEST = 14;

type EngineText = keyof typeof catalog.en;

/** Generated text for this tool, with its {placeholders} filled in. */
export function needlepointText(locale: Locale, key: EngineText, values: Record<string, string | number> = {}): string {
  return catalog[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export const yarnStrands = (req: Pick<NeedlepointRequest, "mesh" | "yarn">) => (req.yarn === "persian" ? (PERSIAN_STRANDS[req.mesh] ?? 2) : 1);

/** Yarn as it's sold for one color: tapestry wool as is, Persian as three-strand lengths, to separate. */
export function yarnYards(stitches: number, req: Pick<NeedlepointRequest, "mesh" | "stitch" | "yarn">): number {
  const share = req.yarn === "persian" ? yarnStrands(req) / PERSIAN_PLY : 1;
  const perStitch = (STITCH_PATH[req.stitch] / req.mesh) * share;
  return Math.ceil(((stitches * perStitch * ALLOWANCE) / 36) * 10) / 10;
}

function tentMarks(req: NeedlepointRequest, grid: string[]): string {
  // One path per color: each cell is a single slant, lower left to upper right.
  return req.colors
    .map((color, c) => {
      let d = "";
      grid.forEach((row, y) => {
        [...row].forEach((cell, x) => {
          if (cellColor(cell) === c) d += `M${x} ${y + 1}l1 -1`;
        });
      });
      return d ? `<path d="${d}" stroke="${color}"/>` : "";
    })
    .join("");
}

const STITCH_STEPS: Record<NeedlepointStitch, EngineText> = { tent: "stepTent", continental: "stepContinental", basketweave: "stepBasketweave" };

export function generateNeedlepoint(req: NeedlepointRequest): NeedlepointResult {
  const locale = req.locale ?? "en";
  const say = (key: EngineText, values: Record<string, string | number> = {}) => needlepointText(locale, key, values);
  const counts = countStitches(req.grid, req.colors.length);
  const stitches = counts.reduce((sum, n) => sum + n, 0);
  const cropped = cropGrid(req.grid);
  const columns = stitches ? cropped[0].length : 0;
  const rows = stitches ? cropped.length : 0;
  const bareStitches = columns * rows - stitches;
  const widthInches = columns / req.mesh;
  const heightInches = rows / req.mesh;
  const strands = yarnStrands(req);
  const colors = req.colors.map((color, i) => {
    const yards = yarnYards(counts[i], req);
    return { symbol: SYMBOLS[i], color, stitches: counts[i], yards, strands, skeins: skeinsFor(yards, YARDS_PER_SKEIN) };
  });
  const width = approxInches(widthInches);
  const height = approxInches(heightInches);
  const canvasWidth = inches(ceilToEighth(widthInches + 2 * req.margin));
  const canvasHeight = inches(ceilToEighth(heightInches + 2 * req.margin));
  const center = chartCenter(columns, rows);
  const turns = stitchingOrder(cropped, req.colors, { backgroundLast: true });
  const background = turns[turns.length - 1];
  const sheets = stitches ? chartSheets(columns, rows).length : 1;
  // Added up to one decimal, since floats would otherwise show 0.30000000000000004.
  const totalYards = Math.round(colors.reduce((sum, c) => sum + c.yards, 0) * 10) / 10;
  const totalSkeins = colors.reduce((sum, c) => sum + c.skeins, 0);
  const used = colors.filter((c) => c.stitches > 0).length;
  const made = makingUp(widthInches, heightInches, req.margin, 0, 0);
  const framed = req.finish === "frame";
  const persian = req.yarn === "persian";

  return {
    svg: {
      stitched: stitchedSvg(cropped[0]?.length ?? 0, cropped.length, req.mesh, req.canvas, say("svgStitched"), 0.72, tentMarks(req, cropped)),
      chart: chartSvg(cropped, say("svgChart")),
    },
    columns,
    rows,
    stitches,
    bareStitches,
    widthInches,
    heightInches,
    width,
    height,
    canvasWidth,
    canvasHeight,
    colors,
    totalYards,
    totalSkeins,
    strands,
    materials: [
      say("materialCanvas", { mesh: req.mesh, cw: canvasWidth, ch: canvasHeight }),
      say(persian ? "materialPersian" : "materialTapestry", { y: totalYards, n: used, s: totalSkeins, per: YARDS_PER_SKEIN }),
      say("materialNeedle", { size: NEEDLES[req.mesh] ?? 20 }),
      say("materialBlocking"),
      framed ? say("materialFrame", { bw: made.boardWidth, bh: made.boardHeight }) : say("materialPillow", { bw: made.backWidth, bh: made.backHeight, sw: made.strip, fw: made.formWidth, fh: made.formHeight }),
    ],
    steps: [
      say("stepCut", { cw: canvasWidth, ch: canvasHeight, w: width, h: height, m: req.margin }),
      say("stepCenter", { cx: center.column, cy: center.row, columns, rows }),
      persian ? say(strands === 1 ? "stepYarnPersianOne" : "stepYarnPersianMany", { strands, mesh: req.mesh }) : say("stepYarnTapestry", { mesh: req.mesh }),
      ...(!persian && req.mesh > TAPESTRY_FINEST ? [say("stepTapestryFine", { mesh: req.mesh })] : []),
      say(STITCH_STEPS[req.stitch]),
      say("stepOrder", background ? { symbol: background.symbol } : { symbol: "-" }),
      ...(bareStitches > 0 ? [say("stepBare", { n: bareStitches })] : []),
      say("stepTails"),
      ...(sheets > 1 ? [say("stepSheets", { n: sheets, o: SHEET_OVERLAP })] : []),
    ],
    order: turns.map((turn) => say("orderLine", { symbol: turn.symbol, hex: turn.color, n: turn.stitches, c: turn.column, r: turn.row })),
    turns,
    finishing: [
      say("stepBlock", { w: width, h: height }),
      ...(framed
        ? [say("stepFrameBoard", { bw: made.boardWidth, bh: made.boardHeight }), say("stepFrameLace", { wrap: req.margin }), say("stepFrameFit", { bw: made.boardWidth, bh: made.boardHeight })]
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
