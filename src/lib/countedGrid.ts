/** Grid rules and share-link coding, shared by the cross-stitch and needlepoint builders. */

export const MIN_GRID = 8;
export const MAX_GRID = 40;
/** "a" to "h" in the grid. */
export const MAX_COLORS = 8;
export const GRID_OPTIONS = Array.from({ length: MAX_GRID - MIN_GRID + 1 }, (_, i) => i + MIN_GRID);

export const sameGrid = (a: string[], b: string[]) => a.length === b.length && a.every((row, i) => row === b[i]);

/** How many colors a grid needs. */
export function colorsUsed(grid: string[]): number {
  let used = 0;
  for (const row of grid) for (const cell of row) if (cell !== ".") used = Math.max(used, cell.charCodeAt(0) - 96);
  return used;
}

/** Grid editing, kept here so it's tested with the share links that have to carry the result. */
export function setCell(grid: string[], row: number, column: number, cell: string): string[] {
  return grid.map((text, y) => (y === row ? text.slice(0, column) + cell + text.slice(column + 1) : text));
}

/** Changes the grid's size, keeping the top left and adding bare ground. */
export function resizeGrid(grid: string[], columns: number, rows: number): string[] {
  return Array.from({ length: rows }, (_, y) => (grid[y] ?? "").slice(0, columns).padEnd(columns, "."));
}

/** Removes a color and its stitches, moving later colors down so their letters still match. */
export function removeColor(state: { grid: string[]; colors: string[] }, index: number): { grid: string[]; colors: string[] } {
  const removed = String.fromCharCode(97 + index);
  return {
    colors: state.colors.filter((_, i) => i !== index),
    grid: state.grid.map((row) => row.replace(/[a-h]/g, (cell) => (cell === removed ? "." : cell > removed ? String.fromCharCode(cell.charCodeAt(0) - 1) : cell))),
  };
}

export const hex = (color: string) => color.slice(1);

/** Rows joined by "-", each as runs: "3.2a" is three bare cells, then two of color a. */
export function encodeGrid(grid: string[]): string {
  return grid.map((row) => row.replace(/(.)\1*/g, (run, cell) => (run.length > 1 ? `${run.length}${cell}` : cell))).join("-");
}

export function decodeGrid(raw: string | null): string[] | null {
  if (!raw) return null;
  const rows: string[] = [];
  for (const part of raw.split("-")) {
    if (!/^(?:\d*[.a-h])+$/.test(part)) return null;
    let row = "";
    for (const [, count, cell] of part.matchAll(/(\d*)([.a-h])/g)) {
      const n = count ? Number(count) : 1;
      // Checked before repeating, so a huge number in a link can't use up memory.
      if (n < 1 || row.length + n > MAX_GRID) return null;
      row += cell.repeat(n);
    }
    rows.push(row);
  }
  const columns = rows[0].length;
  const fits = rows.length >= MIN_GRID && rows.length <= MAX_GRID && columns >= MIN_GRID && rows.every((row) => row.length === columns);
  return fits ? rows : null;
}

export function decodeColors(raw: string | null, needed: number): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length > MAX_COLORS || parts.length < Math.max(needed, 1)) return null;
  return parts.every((part) => /^[0-9a-f]{6}$/i.test(part)) ? parts.map((part) => `#${part.toLowerCase()}`) : null;
}

export function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function pickHex(raw: string | null, fallback: string): string {
  return raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback;
}

/** How a finished square is made up: lacing over a board for a frame, or sewn into a pillow. */
export const FINISH_OPTIONS = ["frame", "pillow"] as const;
export type Finish = (typeof FINISH_OPTIONS)[number];
export const pickFinish = (raw: string | null, fallback: Finish): Finish => (FINISH_OPTIONS as readonly string[]).find((f) => f === raw) as Finish | undefined ?? fallback;
