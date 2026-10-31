import { approxInches } from "./format";
import type { Locale } from "./i18n";
import text from "./messages/stainedGlass.json";
import type { Point } from "./pieces";

/** A leaded glass panel: original parametric designs cut into pieces that can be scored and run by hand. */
export type StainedGlassLayout = "rose" | "quarries" | "medallion" | "sunburst";

export type StainedGlassRequest = {
  layout: StainedGlassLayout;
  /** Outer panel size, in inches, measured over the perimeter came. */
  width: number;
  height: number;
  /** 1 to 3. Falls back to less when the design can't be cut at this size. */
  detail: number;
  /** The came's visible face, and the heart (web) between the glass edges, in inches. */
  cameWidth: number;
  heartWidth: number;
  /** Four glass colors, as #rrggbb. */
  colors: string[];
  locale?: Locale;
};

export type StainedGlassPiece = {
  number: number;
  /** Index into the request's colors. */
  color: number;
  letter: string;
  /** All in inches from the panel's top left corner. Line = came center line; cut = glass; sight = what shows. */
  line: Point[];
  cut: Point[];
  sight: Point[];
  /** Cut glass area in square inches. */
  area: number;
};

export type StainedGlassColor = {
  letter: string;
  color: string;
  pieces: number;
  /** Square inches: the pieces themselves, then with the waste allowance. */
  cutArea: number;
  needed: number;
  squareFeet: number;
  /** Bounding box of the largest piece, so a too-small sheet is caught. */
  largest: string;
};

export type StainedGlassResult = {
  svg: { panel: string; numbered: string };
  layout: StainedGlassLayout;
  /** The size and detail actually drawn, which may be less than asked for: see `notes`. */
  width: number;
  height: number;
  detail: number;
  pieces: StainedGlassPiece[];
  colors: StainedGlassColor[];
  wastePercent: number;
  came: { innerFeet: number; perimeterFeet: number };
  notes: string[];
  rules: string[];
  steps: string[];
};

/**
 * The cutting rules. A score only runs in a straight line from edge to edge of the glass, so
 * every piece must be a convex polygon: no inside corners at all. The numbers are deliberately
 * cautious, for a hobbyist with a hand cutter and running pliers, and are checked on the glass
 * itself, after the came allowance.
 */
export const LIMITS = {
  /** Sharpest corner, in degrees. */
  minAngle: 30,
  /** Narrowest cut glass, and narrowest glass left showing, in inches. */
  minCutWidth: 0.75,
  minSightWidth: 0.375,
  /** Shortest side of the cut glass, in inches. */
  minEdge: 0.375,
  /** Longest a piece may be, as a multiple of its width. */
  maxAspect: 5,
} as const;

/** Allowance for breakage and for cutting shapes out of a rectangular sheet. Rough; plan for more with textured glass. */
export const WASTE = 0.3;
/** Extra came for trimming and mistakes. */
const CAME_WASTE = 0.15;

export const MIN_SIDE = 8;
export const MAX_SIDE = 36;
/** A longer panel is too flimsy for these designs and leaves them no room to work. */
export const MAX_RATIO = 2.5;
/** Rule of thumb: past this a panel generally needs reinforcing. */
const REINFORCE_ABOVE = 24;
/** Pieces are split across their length before they get near `maxAspect`. */
const SPLIT_ASPECT = 4;
const EPS = 1e-7;

type Key = keyof typeof text.en;

export function glassSay(locale: Locale, key: Key, values: Record<string, string | number> = {}): string {
  return text[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
}

/** A fine measure as a fraction, since came is sold in 64ths: 0.046875 reads "3/64". */
export function fineInches(value: number): string {
  const whole = Math.floor(value + EPS);
  let top = Math.round((value - whole) * 128);
  let bottom = 128;
  while (top && top % 2 === 0) {
    top /= 2;
    bottom /= 2;
  }
  if (!top) return `${whole}`;
  return whole ? `${whole} ${top}/${bottom}` : `${top}/${bottom}`;
}

// ---- Geometry. Every piece is convex, so half-plane clipping does all the cutting. ----

export function polygonArea(points: Point[]): number {
  return Math.abs(signedArea(points));
}

function signedArea(points: Point[]): number {
  return points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + x * ny - nx * y;
  }, 0) / 2;
}

/** Drops repeated and straight-through points, and winds the polygon consistently. */
function tidy(points: Point[]): Point[] {
  const unique = points.filter(([x, y], i) => {
    const [px, py] = points[(i + points.length - 1) % points.length];
    return Math.hypot(x - px, y - py) > 1e-6;
  });
  const corners = unique.filter(([x, y], i) => {
    const [px, py] = unique[(i + unique.length - 1) % unique.length];
    const [nx, ny] = unique[(i + 1) % unique.length];
    const cross = (x - px) * (ny - y) - (y - py) * (nx - x);
    return Math.abs(cross) / (Math.hypot(x - px, y - py) * Math.hypot(nx - x, ny - y)) > 1e-6;
  });
  return signedArea(corners) < 0 ? corners.reverse() : corners;
}

/** Keeps the part of a convex polygon where `a x + b y >= c`. */
function clip(points: Point[], a: number, b: number, c: number): Point[] {
  const out: Point[] = [];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    const dp = a * p[0] + b * p[1] - c;
    const dq = a * q[0] + b * q[1] - c;
    if (dp >= 0) out.push(p);
    if ((dp > 0 && dq < 0) || (dp < 0 && dq > 0)) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

/** Keeps the side of the line through `p` and `q` that holds `ref`. */
function keepSide(points: Point[], p: Point, q: Point, ref: Point): Point[] {
  const a = q[1] - p[1];
  const b = p[0] - q[0];
  const c = a * p[0] + b * p[1];
  return a * ref[0] + b * ref[1] >= c ? clip(points, a, b, c) : clip(points, -a, -b, -c);
}

const rect = (x: number, y: number, w: number, h: number): Point[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/** Narrowest width of a convex polygon, which is always measured square to one of its sides, and its length that way. */
export function measure(points: Point[]): { width: number; length: number; along: Point } {
  let best = { width: Infinity, length: 0, along: [1, 0] as Point };
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const len = Math.hypot(nx - x, ny - y);
    const ux = (nx - x) / len;
    const uy = (ny - y) / len;
    const across = points.map(([px, py]) => Math.abs((px - x) * -uy + (py - y) * ux));
    const along = points.map(([px, py]) => (px - x) * ux + (py - y) * uy);
    const width = Math.max(...across);
    if (width < best.width) best = { width, length: Math.max(...along) - Math.min(...along), along: [ux, uy] };
  });
  return best;
}

/** Smallest and largest corner, in degrees, for a consistently wound polygon. */
export function cornerAngles(points: Point[]): number[] {
  return points.map(([x, y], i) => {
    const [px, py] = points[(i + points.length - 1) % points.length];
    const [nx, ny] = points[(i + 1) % points.length];
    const ax = px - x;
    const ay = py - y;
    const bx = nx - x;
    const by = ny - y;
    // Measured from the next side round to the previous one, so an inside corner reads over 180.
    const angle = (Math.atan2(bx * ay - by * ax, bx * ax + by * ay) * 180) / Math.PI;
    return angle < 0 ? angle + 360 : angle;
  });
}

/** The polygon with each side moved inward by its own distance. Fewer corners out means a side vanished. */
function insetBy(points: Point[], distance: (i: number) => number): Point[] {
  let out = points;
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const len = Math.hypot(nx - x, ny - y);
    // Wound positive with y down, the inside of each side is to its right as drawn: (-dy, dx).
    const a = -(ny - y) / len;
    const b = (nx - x) / len;
    out = clip(out, a, b, a * x + b * y + distance(i));
  });
  return out.length >= 3 ? tidy(out) : [];
}

/** Splits a long piece across its length, until none is long for its width. */
function splitLong(points: Point[]): Point[][] {
  const { width, length, along } = measure(points);
  if (length / width <= SPLIT_ASPECT) return [points];
  const positions = points.map(([x, y]) => x * along[0] + y * along[1]);
  const middle = (Math.max(...positions) + Math.min(...positions)) / 2;
  return [clip(points, along[0], along[1], middle), clip(points, -along[0], -along[1], -middle)].flatMap((part) => splitLong(tidy(part)));
}

// ---- Layouts. Each returns convex pieces that exactly fill the panel. ----

type Raw = { points: Point[]; color: number };

/** Plain cells for the part of a long panel beyond a square design. */
function cells(x: number, y: number, w: number, h: number, target: number, color: (i: number, j: number) => number): Raw[] {
  const cols = Math.max(1, Math.round(w / target));
  const rows = Math.max(1, Math.round(h / target));
  const out: Raw[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) out.push({ points: rect(x + (i * w) / cols, y + (j * h) / rows, w / cols, h / rows), color: color(i, j) });
  }
  return out;
}

/** Concentric rings of petals around a center, in a centered square; any extra length becomes side cells. */
function rose(W: number, H: number, detail: number): Raw[] {
  // A strip this narrow couldn't be cut, so a nearly square panel stretches the rose instead. Stretching keeps pieces convex.
  if (W !== H && Math.abs(W - H) / 2 < 2.5) {
    const side = Math.min(W, H);
    return rose(side, side, detail).map(({ points, color }) => ({ points: points.map(([x, y]): Point => [(x * W) / side, (y * H) / side]), color }));
  }
  const s = Math.min(W, H) / 2;
  const cx = W / 2;
  const cy = H / 2;
  const out: Raw[] = [];
  const n = detail === 3 ? 12 : 8;
  const step = (2 * Math.PI) / n;
  // Rays run through the square's corners, since 45 degrees is a multiple of the step away from them.
  const ray = (k: number) => Math.PI / 4 + k * step;
  const at = (angle: number, r: number): Point => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  const edgeOf = (angle: number) => s / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
  const ring = (r: number, offset: number) => Array.from({ length: n }, (_, k) => at(ray(k + offset), r));

  let outer: number;
  if (detail === 1) {
    // A center and one ring of petals: nothing narrow enough to trouble a small panel.
    outer = s * 0.5;
    out.push({ points: ring(outer, 0), color: 0 });
  } else {
    // A star: triangles out from the center's sides, and between them triangles in from the next ring.
    const r0 = s * (detail === 3 ? 0.46 : 0.42);
    const half = r0 * Math.sin(Math.PI / n);
    outer = r0 * Math.cos(Math.PI / n) + 1.7 * half;
    if (r0 >= 3) {
      const core = r0 * 0.5;
      out.push({ points: ring(core, 0.5), color: 0 });
      for (let k = 0; k < n; k++) out.push({ points: [at(ray(k + 0.5), core), at(ray(k + 1.5), core), at(ray(k + 1.5), r0), at(ray(k + 0.5), r0)], color: 3 });
    } else {
      out.push({ points: ring(r0, 0.5), color: 0 });
    }
    for (let k = 0; k < n; k++) {
      out.push({ points: [at(ray(k - 0.5), r0), at(ray(k + 0.5), r0), at(ray(k), outer)], color: 1 });
      out.push({ points: [at(ray(k + 0.5), r0), at(ray(k + 1), outer), at(ray(k), outer)], color: 2 });
    }
  }
  const bands = Math.max(1, Math.round((s - outer) / (4 - detail * 0.5)));
  for (let k = 0; k < n; k++) {
    const [a, b] = [ray(k), ray(k + 1)];
    const radius = (angle: number, band: number) => outer + ((edgeOf(angle) - outer) * band) / bands;
    for (let band = 0; band < bands; band++) {
      out.push({
        points: [at(a, radius(a, band)), at(b, radius(b, band)), at(b, radius(b, band + 1)), at(a, radius(a, band + 1))],
        color: band === bands - 1 ? (k % 2 ? 3 : 1) : k % 2 ? 2 : 3,
      });
    }
  }
  const extra = Math.abs(W - H) / 2;
  if (extra > 0) {
    const shade = (i: number, j: number) => ((i + j) % 2 ? 1 : 3);
    if (W > H) out.push(...cells(0, 0, extra, H, 3.5, shade), ...cells(W - extra, 0, extra, H, 3.5, shade));
    else out.push(...cells(0, 0, W, extra, 3.5, shade), ...cells(0, H - extra, W, extra, 3.5, shade));
  }
  return out;
}

/** Diamond quarries on a lattice sized so its points land exactly on the panel's edges. */
function quarries(W: number, H: number, detail: number): Raw[] {
  const target = [5, 3.75, 2.75][detail - 1];
  let nx = Math.max(1, Math.round(W / target));
  const ny = Math.max(1, Math.round(H / ((W / nx) * 1.4)));
  // The half diamonds on the edges take their sharpest corner from this ratio: keep it inside 30 to 60 degrees.
  const ratio = () => H / ny / (W / nx);
  while (ratio() < 0.6) nx++;
  while (ratio() > 1.7 && nx > 1) nx--;
  const hx = W / nx / 2;
  const hy = H / ny / 2;
  const out: Raw[] = [];
  for (let i = 0; i <= 2 * nx; i++) {
    for (let j = 0; j <= 2 * ny; j++) {
      if ((i + j) % 2) continue;
      const [x, y] = [i * hx, j * hy];
      let points: Point[] = [[x, y - hy], [x + hx, y], [x, y + hy], [x - hx, y]];
      points = clip(clip(clip(clip(points, 1, 0, 0), -1, 0, -W), 0, 1, 0), 0, -1, -H);
      const onEdge = i === 0 || j === 0 || i === 2 * nx || j === 2 * ny;
      const ringFromCenter = (Math.abs(i - nx) + Math.abs(j - ny)) / 2;
      const color = onEdge ? 3 : ringFromCenter < 1 ? 0 : ringFromCenter % 2 < 1 ? 1 : 2;
      out.push({ points, color });
    }
  }
  return out;
}

/** A border with corner blocks around an octagon medallion, in mitred rings at higher detail. */
function medallion(W: number, H: number, detail: number): Raw[] {
  const short = Math.min(W, H);
  const b = Math.min(2.5, Math.max(1.25, short * 0.14));
  const out: Raw[] = [];
  for (const [x, y] of [[0, 0], [W - b, 0], [0, H - b], [W - b, H - b]]) out.push({ points: rect(x, y, b, b), color: 0 });
  const run = (x: number, y: number, w: number, h: number) => {
    const n = Math.max(1, Math.round(Math.max(w, h) / (b * 2.5)));
    for (let i = 0; i < n; i++) {
      out.push({ points: w > h ? rect(x + (i * w) / n, y, w / n, h) : rect(x, y + (i * h) / n, w, h / n), color: i % 2 ? 2 : 1 });
    }
  };
  run(b, 0, W - 2 * b, b);
  run(b, H - b, W - 2 * b, b);
  run(0, b, b, H - 2 * b);
  run(W - b, b, b, H - 2 * b);

  const [x0, y0, iw, ih] = [b, b, W - 2 * b, H - 2 * b];
  const inner = Math.min(iw, ih);
  const c = inner * 0.29;
  out.push({ points: [[x0, y0], [x0 + c, y0], [x0, y0 + c]], color: 2 });
  out.push({ points: [[x0 + iw, y0], [x0 + iw, y0 + c], [x0 + iw - c, y0]], color: 2 });
  out.push({ points: [[x0, y0 + ih], [x0, y0 + ih - c], [x0 + c, y0 + ih]], color: 2 });
  out.push({ points: [[x0 + iw, y0 + ih], [x0 + iw - c, y0 + ih], [x0 + iw, y0 + ih - c]], color: 2 });

  const octagon = (d: number): Point[] => {
    // Moving the sides in by `d` keeps every corner's angle, and shortens the chamfer by (2 - sqrt 2) d.
    const [l, t, r, u] = [x0 + d, y0 + d, x0 + iw - d, y0 + ih - d];
    const e = c - d * (2 - Math.SQRT2);
    return [[l + e, t], [r - e, t], [r, t + e], [r, u - e], [r - e, u], [l + e, u], [l, u - e], [l, t + e]];
  };
  const rings = detail - 1;
  const thickness = inner * 0.12;
  for (let ring = 0; ring < rings; ring++) {
    const [a, z] = [octagon(ring * thickness), octagon((ring + 1) * thickness)];
    a.forEach((p, i) => out.push({ points: [p, a[(i + 1) % 8], z[(i + 1) % 8], z[i]], color: ring % 2 ? 1 : i % 2 ? 3 : 1 }));
  }
  out.push({ points: octagon(rings * thickness), color: 0 });
  return out;
}

/** Rays from a half hub on the bottom edge. Any height above a square becomes plain cells. */
function sunburst(W: number, H: number, detail: number): Raw[] {
  const sunH = Math.min(H, W);
  const top = H - sunH;
  const cx = W / 2;
  const reach = Math.min(W / 2, sunH);
  const n = detail === 1 ? 4 : detail === 2 ? 8 : reach >= 14 ? 16 : 12;
  const step = Math.PI / n;
  // Big enough that the rays start at a cuttable width, but always leaving most of the panel to the rays.
  const hub = Math.min(reach * 0.5, 1.5 / (2 * Math.sin(step / 2)));
  const at = (angle: number, r: number): Point => [cx + r * Math.cos(angle), H - r * Math.sin(angle)];
  const box = rect(0, top, W, sunH);
  const length = (angle: number) => {
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)];
    return Math.min(Math.abs(dx) > EPS ? (W / 2) / Math.abs(dx) : Infinity, dy > EPS ? sunH / dy : Infinity);
  };
  const out: Raw[] = [];
  const hubPoints = Array.from({ length: n + 1 }, (_, k) => at(k * step, hub));
  if (hub >= 3 && detail > 1) {
    const core = hub * 0.5;
    out.push({ points: Array.from({ length: n + 1 }, (_, k) => at(k * step, core)), color: 0 });
    for (let k = 0; k < n; k++) out.push({ points: [at(k * step, core), at((k + 1) * step, core), hubPoints[k + 1], hubPoints[k]], color: 3 });
  } else {
    out.push({ points: hubPoints, color: 0 });
  }
  const bands = Math.max(1, Math.round((reach - hub) / [8, 5, 3.75][detail - 1]));
  for (let k = 0; k < n; k++) {
    const [a, b] = [k * step, (k + 1) * step];
    const middle = (a + b) / 2;
    const reference = at(middle, hub * 1.0001 + 1e-3);
    const wedge = keepSide(keepSide(box, [cx, H], at(a, 1), reference), [cx, H], at(b, 1), reference);
    for (let band = 0; band < bands; band++) {
      const chord = (i: number): [Point, Point] => [
        at(a, hub + ((length(a) - hub) * i) / bands),
        at(b, hub + ((length(b) - hub) * i) / bands),
      ];
      const [p, q] = chord(band);
      let points = keepSide(wedge, p, q, at(middle, reach * 3));
      if (band < bands - 1) {
        const [r, s] = chord(band + 1);
        points = keepSide(points, r, s, [cx, H]);
      }
      out.push({ points, color: band === bands - 1 ? (k % 2 ? 3 : 2) : k % 2 ? 2 : 1 });
    }
  }
  if (top > 0) out.push(...cells(0, 0, W, top, 4, (i, j) => ((i + j) % 2 ? 3 : 1)));
  return out;
}

const LAYOUTS: Record<StainedGlassLayout, (w: number, h: number, detail: number) => Raw[]> = { rose, quarries, medallion, sunburst };
export const LAYOUT_IDS = Object.keys(LAYOUTS) as StainedGlassLayout[];

// ---- Pieces and their checks. ----

/** What, if anything, makes a piece impractical to cut. An empty list means it passes every rule. */
export function cuttingFaults(line: Point[], cut: Point[], sight: Point[]): string[] {
  const faults: string[] = [];
  if (cut.length !== line.length || sight.length !== line.length) return ["vanishing side"];
  const angles = cornerAngles(cut);
  if (angles.some((a) => a >= 180)) faults.push("inside corner");
  if (Math.min(...angles) < LIMITS.minAngle - 1e-6) faults.push("sharp corner");
  const shape = measure(cut);
  if (shape.width < LIMITS.minCutWidth - 1e-6) faults.push("narrow glass");
  if (measure(sight).width < LIMITS.minSightWidth - 1e-6) faults.push("narrow sight");
  if (shape.length / shape.width > LIMITS.maxAspect + 1e-6) faults.push("long sliver");
  const shortest = cut.reduce((least, [x, y], i) => {
    const [nx, ny] = cut[(i + 1) % cut.length];
    return Math.min(least, Math.hypot(nx - x, ny - y));
  }, Infinity);
  if (shortest < LIMITS.minEdge - 1e-6) faults.push("short side");
  return faults;
}

/** A layout at one detail, numbered in reading order, with every piece's cutting outlines. */
export function buildPieces(req: Pick<StainedGlassRequest, "layout" | "width" | "height" | "cameWidth" | "heartWidth">, detail: number): StainedGlassPiece[] {
  const { width: W, height: H, cameWidth: face, heartWidth: heart } = req;
  const raw = LAYOUTS[req.layout](W, H, detail).flatMap((piece) =>
    splitLong(tidy(piece.points)).map((points) => ({ points, color: piece.color })),
  );
  const center = (points: Point[]) => [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
  const ordered = raw
    .map((piece) => ({ ...piece, at: center(piece.points) }))
    .sort((a, b) => Math.round(a.at[1] * 2) - Math.round(b.at[1] * 2) || a.at[0] - b.at[0]);
  return ordered.map(({ points, color }, i) => {
    // Glass stops at the heart: halfway across it between two pieces, all the way across it at the panel's edge.
    const isOuter = (k: number) => {
      const [x, y] = points[k];
      const [nx, ny] = points[(k + 1) % points.length];
      const same = (a: number, b: number, side: number) => Math.abs(a - side) < 1e-6 && Math.abs(b - side) < 1e-6;
      return same(x, nx, 0) || same(x, nx, W) || same(y, ny, 0) || same(y, ny, H);
    };
    const cut = insetBy(points, (k) => (isOuter(k) ? heart : heart / 2));
    const sight = insetBy(points, (k) => (isOuter(k) ? face : face / 2));
    return { number: i + 1, color, letter: String.fromCharCode(65 + color), line: points, cut, sight, area: polygonArea(cut) };
  });
}

/** The panel's size within the limits, and whether it had to change. */
export function fitPanel(width: number, height: number): { width: number; height: number; changed: boolean } {
  let w = Math.min(MAX_SIDE, Math.max(MIN_SIDE, width));
  let h = Math.min(MAX_SIDE, Math.max(MIN_SIDE, height));
  w = Math.min(w, Math.floor(h * MAX_RATIO));
  h = Math.min(h, Math.floor(w * MAX_RATIO));
  return { width: w, height: h, changed: w !== width || h !== height };
}

// ---- Drawings. ----

const U = 100;
const fmt = (n: number) => Number((n * U).toFixed(1));
const pointsAttr = (points: Point[]) => points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ");
const svgOpen = (W: number, H: number, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W * U} ${H * U}" width="${W}in" height="${H}in" role="img"><title>${title}</title>`;

/** The panel as it will look: glass only as far as the came leaves it showing. */
function panelSvg(pieces: StainedGlassPiece[], colors: string[], W: number, H: number, title: string): string {
  const glass = pieces.map((p) => `<polygon points="${pointsAttr(p.sight)}" fill="${colors[p.color]}"/>`).join("");
  return `${svgOpen(W, H, title)}<rect width="${W * U}" height="${H * U}" fill="#26241f"/>${glass}</svg>`;
}

export function labelPoint(points: Point[]): Point {
  // Area centroid of a convex shape, which always lies inside it.
  let [ax, ay, total] = [0, 0, 0];
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const cross = x * ny - nx * y;
    ax += (x + nx) * cross;
    ay += (y + ny) * cross;
    total += cross;
  });
  return [ax / (3 * total), ay / (3 * total)];
}

/** A cutting key: center lines, a tint of each glass, and each piece's number. */
function numberedSvg(pieces: StainedGlassPiece[], colors: string[], W: number, H: number, title: string): string {
  const body = pieces.map((p) => {
    const [x, y] = labelPoint(p.line);
    const size = Math.min(0.55, Math.max(0.24, measure(p.line).width * 0.4));
    return `<polygon points="${pointsAttr(p.line)}" fill="${colors[p.color]}" fill-opacity="0.35" stroke="#26241f" stroke-width="${fmt(0.04)}" stroke-linejoin="round"/><text x="${fmt(x)}" y="${fmt(y)}" dy="0.35em" text-anchor="middle" font-family="sans-serif" font-size="${fmt(size)}" fill="#111111">${p.number}</text>`;
  });
  return `${svgOpen(W, H, title)}<rect width="${W * U}" height="${H * U}" fill="#ffffff"/>${body.join("")}</svg>`;
}

const round = (value: number, places: number) => Number(value.toFixed(places));

export function generateStainedGlass(req: StainedGlassRequest): StainedGlassResult {
  const locale = req.locale ?? "en";
  const fit = fitPanel(req.width, req.height);
  const asked = Math.min(3, Math.max(1, Math.round(req.detail)));
  const base = { layout: req.layout, width: fit.width, height: fit.height, cameWidth: req.cameWidth, heartWidth: req.heartWidth };

  // Step down until nothing breaks a rule. The test suite proves detail 1 always passes for every size and came offered.
  let detail = asked;
  let pieces = buildPieces(base, detail);
  const faultsIn = (list: StainedGlassPiece[]) => list.some((p) => cuttingFaults(p.line, p.cut, p.sight).length > 0);
  while (faultsIn(pieces) && detail > 1) pieces = buildPieces(base, --detail);
  if (faultsIn(pieces)) throw new Error(`No cuttable ${req.layout} layout at ${fit.width} x ${fit.height}`);

  const notes: string[] = [];
  if (fit.changed) notes.push(glassSay(locale, "notePanel", { w: fit.width, h: fit.height, ratio: MAX_RATIO, min: MIN_SIDE, max: MAX_SIDE }));
  if (detail !== asked) notes.push(glassSay(locale, "noteDetail", { asked, detail }));
  if (Math.max(fit.width, fit.height) > REINFORCE_ABOVE) notes.push(glassSay(locale, "noteReinforce", { size: REINFORCE_ABOVE }));

  const colors = req.colors.map((color, i) => {
    const own = pieces.filter((p) => p.color === i);
    const cutArea = own.reduce((sum, p) => sum + p.area, 0);
    const needed = cutArea * (1 + WASTE);
    let largest = "-";
    if (own.length) {
      const big = own.reduce((a, b) => (b.area > a.area ? b : a));
      const xs = big.cut.map(([x]) => x);
      const ys = big.cut.map(([, y]) => y);
      largest = `${approxInches(Math.max(...xs) - Math.min(...xs))}" x ${approxInches(Math.max(...ys) - Math.min(...ys))}"`;
    }
    return { letter: String.fromCharCode(65 + i), color, pieces: own.length, cutArea: round(cutArea, 1), needed: round(needed, 1), squareFeet: round(needed / 144, 2), largest };
  });

  // Every inner line is shared by two pieces; every piece's outer sides add up to the panel's perimeter.
  const perimeter = 2 * (fit.width + fit.height);
  const allSides = pieces.reduce((sum, p) => sum + p.line.reduce((s, [x, y], i) => {
    const [nx, ny] = p.line[(i + 1) % p.line.length];
    return s + Math.hypot(nx - x, ny - y);
  }, 0), 0);
  const innerFeet = (((allSides - perimeter) / 2 / 12) * (1 + CAME_WASTE));
  const title = glassSay(locale, "title");
  const heart = fineInches(req.heartWidth);
  const face = fineInches(req.cameWidth);
  const halfHeart = fineInches(req.heartWidth / 2);

  return {
    svg: {
      panel: panelSvg(pieces, req.colors, fit.width, fit.height, title),
      numbered: numberedSvg(pieces, req.colors, fit.width, fit.height, title),
    },
    layout: req.layout,
    width: fit.width,
    height: fit.height,
    detail,
    pieces,
    colors,
    wastePercent: Math.round(WASTE * 100),
    came: { innerFeet: Math.ceil(innerFeet * 2) / 2, perimeterFeet: Math.ceil((perimeter / 12) * (1 + CAME_WASTE) * 2) / 2 },
    notes,
    rules: [
      glassSay(locale, "ruleConvex"),
      glassSay(locale, "ruleAngle", { angle: LIMITS.minAngle }),
      glassSay(locale, "ruleWidth", { cut: fineInches(LIMITS.minCutWidth), sight: fineInches(LIMITS.minSightWidth) }),
      glassSay(locale, "ruleEdge", { edge: fineInches(LIMITS.minEdge) }),
      glassSay(locale, "ruleAspect", { ratio: LIMITS.maxAspect }),
      glassSay(locale, "ruleAuto"),
    ],
    steps: [
      glassSay(locale, "stepPrint"),
      glassSay(locale, "stepCame", { face, heart }),
      glassSay(locale, "stepAllowance", { half: halfHeart, heart }),
      glassSay(locale, "stepCut"),
      glassSay(locale, "stepAssemble"),
      glassSay(locale, "stepSafety"),
    ],
  };
}
