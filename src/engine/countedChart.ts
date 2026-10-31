import { ceilToEighth, inches } from "./format";

/**
 * What counted-thread tools share: a design as rows of letters, its symbol chart,
 * the order to stitch its colors in, how a large chart splits over sheets, and the
 * sizes for making the finished square up. Each craft keeps its own thread sums and text.
 *
 * In a grid, "." is bare ground and "a" to "h" are the first eight colors.
 */

/** A finished piece's making-up: framed on a board, or sewn into a pillow. */
export type CountedFinish = "frame" | "pillow";

/** Chart symbols, one per color. All of them print in Helvetica and differ without color. */
export const SYMBOLS = ["X", "O", "+", "#", "V", "/", "=", "S"];

/** A cell's color index, or -1 for bare ground. */
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

/** Whole skeins for a length, never fewer than one for a color that's used at all. */
export const skeinsFor = (yards: number, yardsPerSkein: number) => (yards > 0 ? Math.ceil(yards / yardsPerSkein) : 0);

const size = (value: number) => Number(value.toFixed(3));

/** An SVG sized at true scale for its stitches per inch. `drawn` is the stitch marks, in grid units. */
export function stitchedSvg(columns: number, rows: number, perInch: number, ground: string, title: string, strokeWidth: number, drawn: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${rows}" width="${size(columns / perInch)}in" height="${size(rows / perInch)}in" role="img"><title>${title}</title><rect width="${columns}" height="${rows}" fill="${ground}"/><g fill="none" stroke-width="${strokeWidth}" stroke-linecap="square">${drawn}</g></svg>`;
}

/** Room around the chart for numbers and center arrows, in chart units. */
const CHART_CELL = 10;
const CHART_BAND = 22;

export function chartSvg(grid: string[], title: string): string {
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

/** One color's turn: which it is, and the chart square to begin on, counted from 1. */
export type StitchTurn = { index: number; symbol: string; color: string; stitches: number; column: number; row: number };

/** The chart's center in its own numbering: 20 is a square's middle, 20.5 the line between two squares. */
export const chartCenter = (columns: number, rows: number) => ({ column: (columns + 1) / 2, row: (rows + 1) / 2 });

/**
 * Colors in stitching order, from the center out. Each starts on its square nearest
 * the center, and the color reaching closest goes first. Counting stays short that way,
 * since every new color starts beside work already done. Needlepoint asks for its
 * largest color last, as the background worked around everything else.
 */
export function stitchingOrder(grid: string[], colors: string[], { backgroundLast = false } = {}): StitchTurn[] {
  const columns = grid[0]?.length ?? 0;
  const center = chartCenter(columns, grid.length);
  const counts = countStitches(grid, colors.length);
  const nearest = colors.map(() => ({ distance: Infinity, column: 0, row: 0 }));
  grid.forEach((text, y) => {
    [...text].forEach((cell, x) => {
      const c = cellColor(cell);
      if (c < 0) return;
      const distance = (x + 1 - center.column) ** 2 + (y + 1 - center.row) ** 2;
      if (distance < nearest[c].distance) nearest[c] = { distance, column: x + 1, row: y + 1 };
    });
  });
  const turns = colors
    .map((color, index) => ({ index, symbol: SYMBOLS[index], color, stitches: counts[index], column: nearest[index].column, row: nearest[index].row, distance: nearest[index].distance }))
    .filter((turn) => turn.stitches > 0)
    .sort((a, b) => a.distance - b.distance || b.stitches - a.stitches || a.index - b.index);
  if (backgroundLast && turns.length > 1) {
    const background = turns.reduce((most, turn) => (turn.stitches > most.stitches ? turn : most));
    turns.splice(turns.indexOf(background), 1);
    turns.push(background);
  }
  return turns.map((turn) => ({ index: turn.index, symbol: turn.symbol, color: turn.color, stitches: turn.stitches, column: turn.column, row: turn.row }));
}

/** The most squares on a sheet, at a size that stays easy to read while stitching. */
export const SHEET_COLUMNS = 30;
export const SHEET_ROWS = 36;
/** Rows and columns each sheet repeats from the one before, to line them up by. */
export const SHEET_OVERLAP = 3;

/** Part of a chart: its first column and row (from 0), and how many of each repeat its neighbor's. */
export type ChartSheet = { column: number; row: number; columns: number; rows: number; overlapColumns: number; overlapRows: number };

function spans(total: number, most: number): { start: number; length: number }[] {
  const parts: { start: number; length: number }[] = [];
  let start = 0;
  for (;;) {
    const end = Math.min(start + most, total);
    parts.push({ start, length: end - start });
    if (end >= total) return parts;
    start = end - SHEET_OVERLAP;
  }
}

/** Splits a chart over sheets, across and then down. A chart that fits stays on one. */
export function chartSheets(columns: number, rows: number): ChartSheet[] {
  return spans(rows, SHEET_ROWS).flatMap((down, r) =>
    spans(columns, SHEET_COLUMNS).map((across, c) => ({
      column: across.start,
      row: down.start,
      columns: across.length,
      rows: down.length,
      overlapColumns: c ? SHEET_OVERLAP : 0,
      overlapRows: r ? SHEET_OVERLAP : 0,
    })),
  );
}

/** Border strips sewn around a pillow's front, as cut. A 1/2" seam on each edge leaves them 2" wide. */
const PILLOW_STRIP = 3;
const SEAM = 0.5;

/** Sizes for making up a finished piece, as a ruler reads them. */
export type MakingUp = {
  boardWidth: string;
  boardHeight: string;
  /** Ground folded around the board. */
  wrap: string;
  /** The piece, cut down for a pillow's seams. */
  trimWidth: string;
  trimHeight: string;
  strip: string;
  /** Strips for the sides, then for the top and bottom. */
  sideStrip: string;
  topStrip: string;
  backWidth: string;
  backHeight: string;
  pillowWidth: string;
  pillowHeight: string;
  /** A whole-inch form, at or just above the pillow. */
  formWidth: string;
  formHeight: string;
};

/**
 * `frameSpace` is bare ground to show around the design in a frame, and `pillowSpace`
 * in a pillow. Needlepoint is stitched to its edge and shows none.
 */
export function makingUp(width: number, height: number, margin: number, frameSpace: number, pillowSpace: number): MakingUp {
  const up = (value: number) => ceilToEighth(value);
  const trimWidth = up(width + 2 * (pillowSpace + SEAM));
  const trimHeight = up(height + 2 * (pillowSpace + SEAM));
  const border = 2 * (PILLOW_STRIP - SEAM);
  const backWidth = trimWidth + 2 * (PILLOW_STRIP - 2 * SEAM);
  const backHeight = trimHeight + 2 * (PILLOW_STRIP - 2 * SEAM);
  const pillowWidth = trimWidth - 2 * SEAM + border - 2 * SEAM;
  const pillowHeight = trimHeight - 2 * SEAM + border - 2 * SEAM;
  return {
    boardWidth: inches(up(width + 2 * frameSpace)),
    boardHeight: inches(up(height + 2 * frameSpace)),
    wrap: inches(margin - frameSpace),
    trimWidth: inches(trimWidth),
    trimHeight: inches(trimHeight),
    strip: inches(PILLOW_STRIP),
    sideStrip: inches(trimHeight),
    topStrip: inches(backWidth),
    backWidth: inches(backWidth),
    backHeight: inches(backHeight),
    pillowWidth: inches(pillowWidth),
    pillowHeight: inches(pillowHeight),
    formWidth: String(Math.ceil(pillowWidth)),
    formHeight: String(Math.ceil(pillowHeight)),
  };
}
