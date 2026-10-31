import { inches } from "./format";
import type { Locale } from "./i18n";
import messages from "./messages/truchet.json";

export const TRUCHET_STYLES = ["arcs", "chamfers", "diagonals", "triangles"] as const;
export type TruchetStyle = (typeof TRUCHET_STYLES)[number];

export const TRUCHET_ARRANGEMENTS = ["random", "mirror", "checker", "stripes", "waves"] as const;
export type TruchetArrangement = (typeof TRUCHET_ARRANGEMENTS)[number];

export type TruchetColors = { background: string; line: string; accent: string };

export type TruchetRequest = {
  style: TruchetStyle;
  arrangement: TruchetArrangement;
  /** Tiles along each side of the repeat. Even, so mirrored and alternating layouts wrap cleanly. */
  grid: number;
  /** Line width as a percent of a tile's side. Triangles are filled and don't use it. */
  weight: number;
  /** Used only by random and mirror. The same seed always gives the same tiles. */
  seed: number;
  colors: TruchetColors;
  /** Width of one repeat, in inches. */
  repeatWidth: number;
  locale?: Locale;
};

export type TruchetResult = {
  svg: { repeat: string };
  style: string;
  arrangement: string;
  tiles: number;
  repeat: string;
  /** Whether this arrangement reads the seed. */
  seeded: boolean;
};

export type TruchetPoint = readonly [number, number];
/** A straight line, or with `center` a quarter circle around that point. */
export type TruchetPiece = { from: TruchetPoint; to: TruchetPoint; center?: TruchetPoint };
export type TruchetShape = { pieces: TruchetPiece[]; fill?: TruchetPoint[] };
/** One tile to draw. A `wrapped` one is a copy from across the repeat, for what spills over the edge. */
export type TruchetPaint = { col: number; row: number; orient: number; accent: boolean; wrapped: boolean };

/** A tile's side in drawing units, so line weight in percent is also its width in units. */
export const TILE_UNITS = 100;
/** Closes the faint gaps a renderer leaves between filled tiles that share an edge. */
export const HAIRLINE = 1;

const U = TILE_UNITS;
const H = U / 2;

export function truchetText(locale: Locale, key: keyof (typeof messages)["en"], values: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A tile's distinct turns. Triangles have four; the others look the same after a half turn. */
export const orientations = (style: TruchetStyle) => (style === "triangles" ? 4 : 2);

/** The same tile flipped. Triangles are numbered clockwise from the top-left corner. */
const flipAcross = (orient: number) => orient ^ 1;
const flipDown = (style: TruchetStyle, orient: number) => (style === "triangles" ? 3 - orient : orient ^ 1);

/** One tile, in units from its top-left corner. Arcs and chamfers meet at edge midpoints, so any two tiles join. */
export function tileShape(style: TruchetStyle, orient: number): TruchetShape {
  const flipped = orient % 2 === 1;
  if (style === "triangles") {
    const corners: TruchetPoint[] = [[0, 0], [U, 0], [U, U], [0, U]];
    // Each triangle is the half of the tile around one corner.
    return { pieces: [], fill: [corners[orient], corners[(orient + 1) % 4], corners[(orient + 3) % 4]] };
  }
  if (style === "diagonals") return { pieces: [flipped ? { from: [U, 0], to: [0, U] } : { from: [0, 0], to: [U, U] }] };
  const curved = style === "arcs";
  const piece = (from: TruchetPoint, to: TruchetPoint, center: TruchetPoint): TruchetPiece => (curved ? { from, to, center } : { from, to });
  return {
    pieces: flipped
      ? [piece([H, 0], [U, H], [U, 0]), piece([0, H], [H, U], [0, U])]
      : [piece([H, 0], [0, H], [0, 0]), piece([U, H], [H, U], [U, U])],
  };
}

/** A small seeded generator (mulberry32), so a seed means the same tiles on every machine. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each tile's turn, as rows of columns. */
export function truchetOrientations(req: Pick<TruchetRequest, "style" | "arrangement" | "grid" | "seed">): number[][] {
  const { style, arrangement, grid, seed } = req;
  const n = orientations(style);
  const random = seededRandom(seed);
  const rows = Array.from({ length: grid }, () => Array<number>(grid).fill(0));
  const half = Math.ceil(grid / 2);
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      if (arrangement === "random") rows[row][col] = Math.floor(random() * n);
      else if (arrangement === "checker") rows[row][col] = (col + row) % n;
      else if (arrangement === "stripes") rows[row][col] = col % n;
      else if (arrangement === "waves") rows[row][col] = Math.floor((col + row) / 2) % n;
      else if (col < half && row < half) rows[row][col] = Math.floor(random() * n);
    }
  }
  if (arrangement === "mirror") {
    // Only the top-left quarter is random; the rest is its reflection.
    for (let row = 0; row < grid; row++) {
      for (let col = 0; col < grid; col++) {
        if (col >= half) rows[row][col] = flipAcross(rows[row][grid - 1 - col]);
      }
    }
    for (let row = half; row < grid; row++) {
      for (let col = 0; col < grid; col++) rows[row][col] = flipDown(style, rows[grid - 1 - row][col]);
    }
  }
  return rows;
}

/**
 * Every tile in painting order. Accent tiles go on top, so where the two colors
 * meet the result doesn't depend on which tile came first, and tiles along an edge
 * repeat across the far edge, so what spills out comes back in on the other side.
 */
export function truchetPaintOrder(req: TruchetRequest): TruchetPaint[] {
  const { grid } = req;
  const shifts = (i: number) => [0, ...(i === 0 ? [grid] : []), ...(i === grid - 1 ? [-grid] : [])];
  const painted = truchetOrientations(req).flatMap((cols, row) =>
    cols.flatMap((orient, col) =>
      shifts(row).flatMap((dy) => shifts(col).map((dx) => ({ col: col + dx, row: row + dy, orient, accent: orient % 2 === 1, wrapped: dx !== 0 || dy !== 0 }))),
    ),
  );
  return [...painted.filter((p) => !p.accent), ...painted.filter((p) => p.accent)];
}

const coord = (n: number) => Number(n.toFixed(2));

function tilePath({ col, row, orient }: TruchetPaint, style: TruchetStyle): string {
  const ox = col * U;
  const oy = row * U;
  const at = ([x, y]: TruchetPoint) => `${coord(x + ox)} ${coord(y + oy)}`;
  const { pieces, fill } = tileShape(style, orient);
  if (fill) return `M${fill.map(at).join("L")}Z`;
  return pieces
    .map(({ from, to, center }) => {
      if (!center) return `M${at(from)}L${at(to)}`;
      const clockwise = (from[0] - center[0]) * (to[1] - center[1]) - (from[1] - center[1]) * (to[0] - center[0]) > 0;
      return `M${at(from)}A${H} ${H} 0 0 ${clockwise ? 1 : 0} ${at(to)}`;
    })
    .join("");
}

function repeatSvg(req: TruchetRequest, title: string): string {
  const side = req.grid * U;
  const paint = truchetPaintOrder(req);
  const group = (accent: boolean, color: string) => {
    const paths = paint
      .filter((p) => p.accent === accent)
      .map((p) => `<path${p.wrapped ? ' data-wrap="1"' : ""} d="${tilePath(p, req.style)}"/>`)
      .join("");
    const filled = req.style === "triangles";
    return `<g fill="${filled ? color : "none"}" stroke="${color}" stroke-width="${filled ? HAIRLINE : req.weight}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
  };
  const size = Number(req.repeatWidth.toFixed(3));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${size}in" height="${size}in" role="img"><title>${title}</title><rect width="${side}" height="${side}" fill="${req.colors.background}"/>${group(false, req.colors.line)}${group(true, req.colors.accent)}</svg>`;
}

export function generateTruchet(req: TruchetRequest): TruchetResult {
  const locale = req.locale ?? "en";
  return {
    svg: { repeat: repeatSvg(req, truchetText(locale, "svgTitle")) },
    style: truchetText(locale, `style_${req.style}`),
    arrangement: truchetText(locale, `arrangement_${req.arrangement}`),
    tiles: req.grid * req.grid,
    repeat: inches(req.repeatWidth),
    seeded: req.arrangement === "random" || req.arrangement === "mirror",
  };
}
