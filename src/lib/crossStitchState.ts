import type catalog from "@/i18n/messages/crossStitch.json";
import { localeAccent } from "./localeAccent";
import type { CrossStitchCraft, CrossStitchRequest, Locale } from "./generator";

/** The cross-stitch builder's options, motifs and share links. */

export const MIN_GRID = 8;
export const MAX_GRID = 40;
/** "a" to "h" in the grid. */
export const MAX_COLORS = 8;
export const GRID_OPTIONS = Array.from({ length: MAX_GRID - MIN_GRID + 1 }, (_, i) => i + MIN_GRID);
export const COUNT_OPTIONS: Record<CrossStitchCraft, number[]> = { cross: [11, 14, 16, 18, 22], needlepoint: [10, 12, 13, 14, 18] };
export const DEFAULT_COUNT: Record<CrossStitchCraft, number> = { cross: 14, needlepoint: 13 };
export const STRAND_OPTIONS = [1, 2, 3, 4, 6];
export const MARGIN_OPTIONS = [1, 2, 3, 4, 5, 6];
const DEFAULT_FABRIC = "#f7f3e8";

export type MotifId = keyof typeof catalog.en.motifs;
export type Motif = { id: MotifId; grid: string[]; colors: string[] };

/** Drawn for this site: none of these copies a published chart. */
export const MOTIFS: Motif[] = [
  {
    id: "rosette",
    colors: ["#23395d", "#b3403a", "#e0a526"],
    grid: [
      "..........b..........",
      "..........c..........",
      "..........c..........",
      ".......ca...ac.......",
      "....a.aac.a.caa.a....",
      ".....ab..cac..ba.....",
      "....abab..a..baba....",
      "...ca.bbbbabbbb.ac...",
      "...ac..bbaaabb..ca...",
      ".....c.baacaab.c.....",
      "bcc.aaaaacccaaaaa.ccb",
      ".....c.baacaab.c.....",
      "...ac..bbaaabb..ca...",
      "...ca.bbbbabbbb.ac...",
      "....abab..a..baba....",
      ".....ab..cac..ba.....",
      "....a.aac.a.caa.a....",
      ".......ca...ac.......",
      "..........c..........",
      "..........c..........",
      "..........b..........",
    ],
  },
  {
    id: "heart",
    colors: ["#b3262e", "#e8848a"],
    grid: [
      "...aaaa...aaaa...",
      "..aaaaaa.aaaaaa..",
      ".aabbaaaaaaaaaaa.",
      ".abbaaaaaaaaaaaa.",
      ".abaaaaaaaaaaaaa.",
      ".aaaaaaaaaaaaaaa.",
      "..aaaaaaaaaaaaa..",
      "...aaaaaaaaaaa...",
      "....aaaaaaaaa....",
      ".....aaaaaaa.....",
      "......aaaaa......",
      ".......aaa.......",
      "........a........",
    ],
  },
  {
    id: "pine",
    colors: ["#1f5c3d", "#6b4226", "#e0a526"],
    grid: [
      "........c........",
      ".......ccc.......",
      "........a........",
      ".......aaa.......",
      "......aacaa......",
      ".....aaaaaaa.....",
      "......aaaaa......",
      ".....aaacaaa.....",
      "....aaaaaaaaa....",
      "...aacaaaaacaa...",
      ".....aaaaaaa.....",
      "....aaaaaaaaa....",
      "...aaaacaaaaaa...",
      "..aaaaaaaaacaaa..",
      ".aaacaaaaaaaaaaa.",
      "aaaaaaaaaaaaaaaaa",
      ".......bbb.......",
      ".......bbb.......",
      ".......bbb.......",
    ],
  },
  {
    id: "cottage",
    colors: ["#d9b98a", "#9c3b2e", "#2b4a6b", "#5a4634"],
    grid: [
      "..............dd...",
      "..............dd...",
      ".........b....dd...",
      "........bbb...dd...",
      ".......bbbbb..dd...",
      "......bbbbbbb.dd...",
      ".....bbbbbbbbbdd...",
      "....bbbbbbbbbbb....",
      "...bbbbbbbbbbbbb...",
      "..bbbbbbbbbbbbbbb..",
      ".bbbbbbbbbbbbbbbbb.",
      "...aaaaaaaaaaaaa...",
      "...accaaaaaaacca...",
      "...accaacccaacca...",
      "...aaaaacccaaaaa...",
      "...aaaaacccaaaaa...",
      "...aaaaacccaaaaa...",
    ],
  },
  {
    id: "sailboat",
    colors: ["#c8452f", "#e8b92f", "#2f6f9f", "#3a2a20"],
    grid: [
      ".........d.........",
      ".........daa.......",
      ".........daaa......",
      ".........daaaa.....",
      "........bdaaaaa....",
      ".......bbdaaaaaa...",
      "......bbbdaaaaaaa..",
      ".....bbbbdaaaaaaaa.",
      "....bbbbbdaaaaaaaa.",
      ".........d.........",
      "..ddddddddddddddd..",
      "...ddddddddddddd...",
      "....ddddddddddd....",
      "c..cc...cc...cc...c",
      ".cc..cc...cc...cc..",
    ],
  },
  {
    id: "diamonds",
    colors: ["#23395d", "#2f8f9d", "#b3403a"],
    grid: [
      "aaaaaaaaaaaaaaaaaaaaaaaaa",
      ".........................",
      "a.......a.......a.......a",
      ".a.....a.a.....a.a.....a.",
      "b.a...a.b.a...a.b.a...a.b",
      "cb.a.a.bcb.a.a.bcb.a.a.bc",
      "b.a...a.b.a...a.b.a...a.b",
      ".a.....a.a.....a.a.....a.",
      "a.......a.......a.......a",
      ".........................",
      "aaaaaaaaaaaaaaaaaaaaaaaaa",
    ],
  },
];

const DEFAULT_MOTIF = MOTIFS[0];

/** What a color takes when a hand-edited grid needs one that wasn't chosen. */
const SPARE_COLORS = ["#b3262e", "#1f5c3d", "#23395d", "#e0a526", "#6b4226", "#7a4b9a", "#2f8f9d", "#1a1a1a"];

/** A motif's colors. Only the opening design varies by language. */
export function motifColors(motif: Motif, locale: Locale = "en"): string[] {
  return motif.id === DEFAULT_MOTIF.id ? motif.colors.map((color, i) => (i === motif.colors.length - 1 ? localeAccent(locale, color) : color)) : motif.colors;
}

const sameGrid = (a: string[], b: string[]) => a.length === b.length && a.every((row, i) => row === b[i]);
const findMotif = (grid: string[]) => MOTIFS.find((motif) => sameGrid(motif.grid, grid));

/** How many colors a grid needs. */
export function colorsUsed(grid: string[]): number {
  let used = 0;
  for (const row of grid) for (const cell of row) if (cell !== ".") used = Math.max(used, cell.charCodeAt(0) - 96);
  return used;
}

/** The colors a grid has unless the share link says otherwise. */
function defaultColors(grid: string[], locale: Locale): string[] {
  const motif = findMotif(grid);
  return motif ? motifColors(motif, locale) : SPARE_COLORS.slice(0, Math.max(colorsUsed(grid), 1));
}

export function defaultCrossStitchState(locale: Locale = "en"): CrossStitchRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    grid: DEFAULT_MOTIF.grid,
    colors: motifColors(DEFAULT_MOTIF, locale),
    fabric: DEFAULT_FABRIC,
    craft: "cross",
    count: DEFAULT_COUNT.cross,
    strands: 2,
    margin: 3,
  };
}

/** Grid editing, kept here so it's tested with the share links that have to carry the result. */
export function setCell(grid: string[], row: number, column: number, cell: string): string[] {
  return grid.map((text, y) => (y === row ? text.slice(0, column) + cell + text.slice(column + 1) : text));
}

/** Changes the grid's size, keeping the top left and adding bare fabric. */
export function resizeGrid(grid: string[], columns: number, rows: number): string[] {
  return Array.from({ length: rows }, (_, y) => (grid[y] ?? "").slice(0, columns).padEnd(columns, "."));
}

/** Removes a color and its stitches, moving later colors down so their letters still match. */
export function removeColor(state: CrossStitchRequest, index: number): Pick<CrossStitchRequest, "grid" | "colors"> {
  const removed = String.fromCharCode(97 + index);
  return {
    colors: state.colors.filter((_, i) => i !== index),
    grid: state.grid.map((row) => row.replace(/[a-h]/g, (cell) => (cell === removed ? "." : cell > removed ? String.fromCharCode(cell.charCodeAt(0) - 1) : cell))),
  };
}

const hex = (color: string) => color.slice(1);

/** Rows joined by "-", each as runs: "3.2a" is three bare cells, then two of color a. */
function encodeGrid(grid: string[]): string {
  return grid.map((row) => row.replace(/(.)\1*/g, (run, cell) => (run.length > 1 ? `${run.length}${cell}` : cell))).join("-");
}

function decodeGrid(raw: string | null): string[] | null {
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

function decodeColors(raw: string | null, needed: number): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length > MAX_COLORS || parts.length < Math.max(needed, 1)) return null;
  return parts.every((part) => /^[0-9a-f]{6}$/i.test(part)) ? parts.map((part) => `#${part.toLowerCase()}`) : null;
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function parseCrossStitchState(params: { get(name: string): string | null }, locale: Locale = "en"): CrossStitchRequest {
  const base = defaultCrossStitchState(locale);
  const grid = decodeGrid(params.get("g")) ?? MOTIFS.find((motif) => motif.id === params.get("m"))?.grid ?? base.grid;
  const craft: CrossStitchCraft = params.get("craft") === "needlepoint" ? "needlepoint" : "cross";
  const fabric = params.get("f");
  return {
    ...(locale === "en" ? {} : { locale }),
    grid,
    colors: decodeColors(params.get("c"), colorsUsed(grid)) ?? defaultColors(grid, locale),
    fabric: fabric && /^[0-9a-f]{6}$/i.test(fabric) ? `#${fabric.toLowerCase()}` : base.fabric,
    craft,
    count: pick(params.get("count"), COUNT_OPTIONS[craft], DEFAULT_COUNT[craft]),
    strands: pick(params.get("strands"), STRAND_OPTIONS, base.strands),
    margin: pick(params.get("margin"), MARGIN_OPTIONS, base.margin),
  };
}

export function serializeCrossStitchState(state: CrossStitchRequest): string {
  const locale = state.locale ?? "en";
  const base = defaultCrossStitchState(locale);
  const params = new URLSearchParams();
  if (!sameGrid(state.grid, base.grid)) {
    const motif = findMotif(state.grid);
    if (motif) params.set("m", motif.id);
    else params.set("g", encodeGrid(state.grid));
  }
  const encoded = state.colors.map(hex).join("-");
  if (encoded !== defaultColors(state.grid, locale).map(hex).join("-")) params.set("c", encoded);
  if (state.fabric !== base.fabric) params.set("f", hex(state.fabric));
  if (state.craft !== base.craft) params.set("craft", state.craft);
  if (state.count !== DEFAULT_COUNT[state.craft]) params.set("count", String(state.count));
  if (state.strands !== base.strands) params.set("strands", String(state.strands));
  if (state.margin !== base.margin) params.set("margin", String(state.margin));
  return params.toString();
}
