import { approxInches, ceilToEighth, inches } from "./format";
import type { Locale } from "./i18n";
import catalog from "./messages/crossStitch.json";

export type CrossStitchCraft = "cross" | "needlepoint";

/**
 * A counted-thread design. Each string in `grid` is a row, read left to right:
 * "." is bare fabric, and "a" to "h" are `colors[0]` to `colors[7]`.
 */
export type CrossStitchRequest = {
  grid: string[];
  /** Plain colors the stitcher chooses, not matched to any thread brand. */
  colors: string[];
  /** The fabric or canvas, for the preview only. */
  fabric: string;
  craft: CrossStitchCraft;
  /** Stitches per inch: Aida count, or needlepoint canvas mesh. */
  count: number;
  /** Strands of six-strand floss in the needle. Cross stitch only. */
  strands: number;
  /** Bare fabric to leave on every side, in inches. */
  margin: number;
  locale?: Locale;
};

export type CrossStitchColor = { symbol: string; color: string; stitches: number; yards: number };

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
  steps: string[];
};

/** Chart symbols, one per color. All of them print in Helvetica and differ without color. */
export const SYMBOLS = ["X", "O", "+", "#", "V", "/", "=", "S"];
/** Extra for starting, ending and traveling between stitches. */
const ALLOWANCE = 1.25;

const DIAGONAL = Math.SQRT2;
/** A full cross, in fabric squares: two diagonals on the front, two straight legs on the back. */
const CROSS_PATH = 2 * DIAGONAL + 2;
/** A continental tent stitch: one diagonal on the front, one longer slant on the back. */
const TENT_PATH = DIAGONAL + Math.sqrt(5);

type EngineText = keyof typeof catalog.en;

/** Generated text for this tool, with its {placeholders} filled in. */
export function crossStitchText(locale: Locale, key: EngineText, values: Record<string, string | number> = {}): string {
  return catalog[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A cell's color index, or -1 for bare fabric. */
export const cellColor = (cell: string) => (cell === "." ? -1 : cell.charCodeAt(0) - 97);

/** The grid cut down to its stitches. An empty grid stays as it is, so there's still a chart to show. */
export function cropGrid(grid: string[]): string[] {
  const filled = grid.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === "." ? [] : [[x, y]])));
  if (!filled.length) return grid;
  const xs = filled.map(([x]) => x);
  const ys = filled.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  return grid.slice(Math.min(...ys), Math.max(...ys) + 1).map((row) => row.slice(left, right + 1));
}

/** Stitches per color. */
export function countStitches(grid: string[], colors: number): number[] {
  const counts = Array<number>(colors).fill(0);
  for (const row of grid) {
    for (const cell of row) {
      const color = cellColor(cell);
      if (color >= 0) {
        if (color >= colors) throw new Error(`Grid uses a color that wasn't given: ${cell}`);
        counts[color]++;
      }
    }
  }
  return counts;
}

/**
 * Length of thread for one color, from the path a stitch takes through the fabric.
 * Cross stitch gives yards of six-strand floss, which is split to the strands in
 * use; needlepoint gives yards of thread as it goes through the needle.
 */
export function threadYards(stitches: number, req: Pick<CrossStitchRequest, "craft" | "count" | "strands">): number {
  const perStitch = (req.craft === "cross" ? CROSS_PATH * (req.strands / 6) : TENT_PATH) / req.count;
  return Math.ceil(((stitches * perStitch * ALLOWANCE) / 36) * 10) / 10;
}

const size = (value: number) => Number(value.toFixed(3));

function stitchedSvg(req: CrossStitchRequest, grid: string[], title: string): string {
  const columns = grid[0]?.length ?? 0;
  // One path per color: each cell is its two crossing legs.
  const paths = req.colors.map((color, c) => {
    let d = "";
    grid.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cellColor(cell) === c) d += `M${x} ${y}l1 1M${x + 1} ${y}l-1 1`;
      });
    });
    return d ? `<path d="${d}" stroke="${color}"/>` : "";
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${grid.length}" width="${size(columns / req.count)}in" height="${size(grid.length / req.count)}in" role="img"><title>${title}</title><rect width="${columns}" height="${grid.length}" fill="${req.fabric}"/><g fill="none" stroke-width="0.34" stroke-linecap="square">${paths.join("")}</g></svg>`;
}

/** Room around the chart for numbers and center arrows, in chart units. */
const CHART_CELL = 10;
const CHART_BAND = 22;

function chartSvg(grid: string[], title: string): string {
  const columns = grid[0]?.length ?? 0;
  const rows = grid.length;
  const w = columns * CHART_CELL;
  const h = rows * CHART_CELL;
  const parts: string[] = [];

  grid.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const color = cellColor(cell);
      if (color >= 0) parts.push(`<text x="${x * CHART_CELL + 5}" y="${y * CHART_CELL + 5}">${SYMBOLS[color]}</text>`);
    });
  });
  const lines = (count: number, line: (at: number) => string, every: number) =>
    Array.from({ length: count + 1 }, (_, i) => i)
      .filter((i) => (every === 10 ? i % 10 === 0 : i % 10 !== 0))
      .map((i) => line(i * CHART_CELL))
      .join("");
  const vertical = (x: number) => `M${x} 0V${h}`;
  const horizontal = (y: number) => `M0 ${y}H${w}`;
  const numbers = [
    ...Array.from({ length: Math.floor(columns / 10) }, (_, i) => `<text x="${(i + 1) * 10 * CHART_CELL}" y="-15">${(i + 1) * 10}</text>`),
    ...Array.from({ length: Math.floor(rows / 10) }, (_, i) => `<text x="-15" y="${(i + 1) * 10 * CHART_CELL}">${(i + 1) * 10}</text>`),
  ];
  const arrows = `<path d="M${w / 2 - 4} -9h8l-4 7zM-9 ${h / 2 - 4}v8l7 -4z" fill="#1a1a1a"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-CHART_BAND} ${-CHART_BAND} ${w + CHART_BAND + 2} ${h + CHART_BAND + 2}" width="${size((w + CHART_BAND + 2) / 50)}in" height="${size((h + CHART_BAND + 2) / 50)}in" role="img"><title>${title}</title>` +
    `<rect x="${-CHART_BAND}" y="${-CHART_BAND}" width="${w + CHART_BAND + 2}" height="${h + CHART_BAND + 2}" fill="#ffffff"/>` +
    `<path d="${lines(columns, vertical, 1)}${lines(rows, horizontal, 1)}" fill="none" stroke="#b5b0a6" stroke-width="0.5"/>` +
    `<path d="${lines(columns, vertical, 10)}${lines(rows, horizontal, 10)}" fill="none" stroke="#1a1a1a" stroke-width="1"/>` +
    `<g font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#1a1a1a" text-anchor="middle" dominant-baseline="central">${parts.join("")}${numbers.join("")}</g>` +
    arrows +
    `</svg>`
  );
}

export function generateCrossStitch(req: CrossStitchRequest): CrossStitchResult {
  const locale = req.locale ?? "en";
  const counts = countStitches(req.grid, req.colors.length);
  const stitches = counts.reduce((sum, n) => sum + n, 0);
  const cropped = cropGrid(req.grid);
  const columns = stitches ? cropped[0].length : 0;
  const rows = stitches ? cropped.length : 0;
  const widthInches = columns / req.count;
  const heightInches = rows / req.count;
  const colors = req.colors.map((color, i) => ({ symbol: SYMBOLS[i], color, stitches: counts[i], yards: threadYards(counts[i], req) }));
  const width = approxInches(widthInches);
  const height = approxInches(heightInches);
  const fabricWidth = inches(ceilToEighth(widthInches + 2 * req.margin));
  const fabricHeight = inches(ceilToEighth(heightInches + 2 * req.margin));
  const cross = req.craft === "cross";

  return {
    svg: {
      stitched: stitchedSvg(req, cropped, crossStitchText(locale, "svgStitched")),
      chart: chartSvg(cropped, crossStitchText(locale, "svgChart")),
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
    // Added up to one decimal, since floats would otherwise show 0.30000000000000004.
    totalYards: Math.round(colors.reduce((sum, c) => sum + c.yards, 0) * 10) / 10,
    steps: [
      crossStitchText(locale, cross ? "stepCutCross" : "stepCutCanvas", { fw: fabricWidth, fh: fabricHeight, w: width, h: height, m: req.margin }),
      crossStitchText(locale, "stepCenter"),
      cross
        ? crossStitchText(locale, req.strands === 1 ? "stepCrossOne" : "stepCrossMany", { count: req.count, strands: req.strands })
        : crossStitchText(locale, "stepTent", { count: req.count }),
      crossStitchText(locale, cross ? "stepFinishCross" : "stepFinishCanvas"),
    ],
  };
}
