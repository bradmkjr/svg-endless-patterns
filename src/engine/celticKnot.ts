import type { Locale } from "./i18n";
import knotText from "./messages/celticKnot.json";

/**
 * Celtic knots by plaitwork. The grid's cell corners sit at even lattice points;
 * a "site" is any point whose x + y is odd. Strands run diagonally from site to site.
 * At an open site two strands cross. At a wall (every site on the border, plus each
 * break) a strand reflects and the crossing is gone. Tracing that gives closed loops,
 * and a checkerboard rule on the crossings makes over and under alternate along each.
 */

export const BREAK_PATTERNS = ["none", "random", "mirror", "rotate", "frame", "cross", "diamond", "lattice"] as const;
export type CelticBreakPattern = (typeof BREAK_PATTERNS)[number];

/** Open and tight leave a gap at each under-crossing; off lets the ribbons merge. */
export type CelticInterlace = "open" | "tight" | "off";

export type CelticKnotRequest = {
  /** Grid cells across and down. */
  cols: number;
  rows: number;
  pattern: CelticBreakPattern;
  /** Used only by random, mirror and rotate. The same seed always gives the same breaks. */
  seed: number;
  /** Percent of crossings to try replacing with a break, for the seeded patterns. */
  density: number;
  /** Ribbon width, as a percent of half a grid cell. */
  ribbon: number;
  interlace: CelticInterlace;
  colors: string[];
  /** Give each strand the next color in turn; otherwise all use the first. */
  perStrand: boolean;
  background: string;
  outline: string;
  /** Longest side of the finished design, in inches. */
  size: number;
  locale?: Locale;
};

export type CelticStrand = { index: number; color: string; crossings: number };

export type CelticKnotResult = {
  svg: { art: string; cut: string; stencil: string; coloring: string };
  strands: number;
  crossings: number;
  breaks: number;
  /** Separate closed shapes in the cut file. */
  pieces: number;
  strandList: CelticStrand[];
  steps: string[];
};

export type Wall = "h" | "v";
export type KnotBreak = { x: number; y: number; wall: Wall };
/** One site on a strand's way round, with the direction the strand arrived in. */
export type KnotStop = { x: number; y: number; dx: number; dy: number; wall: Wall | null; over: boolean };

/** Plain JSON for one drawn path, shared by the SVG and the PDF. */
export type KnotShape = { d: string; fill?: string; stroke?: string; strokeWidth?: number };
export type KnotDrawing = { width: number; height: number; art: KnotShape[]; cut: KnotShape[]; stencil: KnotShape[]; coloring: KnotShape[] };

type Point = { x: number; y: number };
type Phrase = keyof typeof knotText.en;

/** SVG units per lattice step. */
const UNIT = 20;
const MARGIN = 0.4;
/** How far a strand's center stays from a wall, in lattice steps. Half a step leaves room for the widest ribbon. */
const WALL_CLEARANCE = 0.5;
const SAMPLES_PER_STOP = 12;
const GAPS: Record<CelticInterlace, number> = { open: 0.12, tight: 0.05, off: 0 };
/** A stencil needs a visible break in its lines even if the design is tight. */
const STENCIL_GAP = 0.1;
const OUTLINE_WIDTH = 0.04 * UNIT;
const STENCIL_WIDTH = 0.05 * UNIT;
const COLORING_WIDTH = 0.06 * UNIT;

export function knotSay(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  return knotText[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A small seeded generator (mulberry32), so a seed means the same breaks on every machine. */
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

/** Sites that aren't on the border, left to right and top to bottom. */
function interiorSites(cols: number, rows: number): Point[] {
  const sites: Point[] = [];
  for (let y = 1; y < rows * 2; y++) {
    for (let x = 1; x < cols * 2; x++) if ((x + y) % 2) sites.push({ x, y });
  }
  return sites;
}

/** The copies of a break that a seeded symmetric pattern must also place. */
function orbit(b: KnotBreak, cols: number, rows: number, pattern: CelticBreakPattern): KnotBreak[] {
  const X = cols * 2;
  const Y = rows * 2;
  const turned: Wall = b.wall === "h" ? "v" : "h";
  if (pattern === "mirror") {
    return [b, { ...b, x: X - b.x }, { ...b, y: Y - b.y }, { ...b, x: X - b.x, y: Y - b.y }];
  }
  if (pattern === "rotate") {
    const half = { ...b, x: X - b.x, y: Y - b.y };
    if (cols !== rows) return [b, half];
    return [b, half, { x: X - b.y, y: b.x, wall: turned }, { x: b.y, y: X - b.x, wall: turned }];
  }
  return [b];
}

/** The fixed patterns, measured from the center so they stay symmetric at any grid size. */
function fixedBreak({ x, y }: Point, cols: number, rows: number, pattern: CelticBreakPattern): Wall | null {
  const a = Math.abs(x - cols);
  const b = Math.abs(y - rows);
  const X = cols * 2;
  const Y = rows * 2;
  if (pattern === "frame") {
    // A wall one cell in from the border, left open at the middle of each side so the two parts stay linked.
    if (cols < 3 || rows < 3) return null;
    if ((y === 2 || y === Y - 2) && x > 2 && x < X - 2 && a > 1) return "h";
    if ((x === 2 || x === X - 2) && y > 2 && y < Y - 2 && b > 1) return "v";
    return null;
  }
  if (pattern === "cross") {
    // Walls along both center lines, with every other one left open.
    if (a === 0 && Math.floor(b / 2) % 2 === 1) return "v";
    if (b === 0 && Math.floor(a / 2) % 2 === 1) return "h";
    return null;
  }
  if (pattern === "diamond") {
    // Rings around the center, turning the wall with the site so each ring stays open enough to link.
    const distance = a + b;
    if (Math.floor(distance / 2) % 3 !== 1) return null;
    return a % 2 === 1 ? "h" : "v";
  }
  if (pattern === "lattice") {
    const step = (cols + rows) % 2 ? 2 : 1;
    if (a % 4 === step && b % 4 === 0) return "h";
    if (a % 4 === 0 && b % 4 === step) return "v";
    return null;
  }
  return null;
}

/** The breaks for a pattern, sorted, and the same every time for the same inputs. */
export function placeBreaks(cols: number, rows: number, pattern: CelticBreakPattern, seed: number, density: number): KnotBreak[] {
  const sites = interiorSites(cols, rows);
  const found = new Map<string, KnotBreak>();
  if (pattern === "random" || pattern === "mirror" || pattern === "rotate") {
    const random = seededRandom(seed);
    const seen = new Set<string>();
    for (const site of sites) {
      // Always draw both numbers, so one site's outcome never shifts the next.
      const roll = random();
      const wall: Wall = random() < 0.5 ? "h" : "v";
      if (seen.has(`${site.x},${site.y}`)) continue;
      const copies = orbit({ ...site, wall }, cols, rows, pattern);
      for (const copy of copies) {
        seen.add(`${copy.x},${copy.y}`);
        if (roll < density / 100) found.set(`${copy.x},${copy.y}`, copy);
      }
    }
  } else {
    for (const site of sites) {
      const wall = fixedBreak(site, cols, rows, pattern);
      if (wall) found.set(`${site.x},${site.y}`, { ...site, wall });
    }
  }
  return [...found.values()].sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Follows the strands until every lattice arc is used. Each site pairs up the arcs
 * that meet it, so the arcs form disjoint cycles and every walk closes.
 */
export function traceStrands(cols: number, rows: number, breaks: KnotBreak[]): KnotStop[][] {
  const X = cols * 2;
  const Y = rows * 2;
  const walls = new Map(breaks.map((b) => [`${b.x},${b.y}`, b.wall]));
  const wallAt = (x: number, y: number): Wall | null => {
    if (y === 0 || y === Y) return "h";
    if (x === 0 || x === X) return "v";
    return walls.get(`${x},${y}`) ?? null;
  };
  const used = new Set<number>();
  // An arc's midpoint, which is the same number whichever way it is walked.
  const arc = (x: number, y: number, dx: number, dy: number) => 2 * x + dx + (2 * y + dy) * (2 * X + 3);
  const loops: KnotStop[][] = [];

  for (let y0 = 0; y0 <= Y; y0++) {
    for (let x0 = 0; x0 <= X; x0++) {
      if ((x0 + y0) % 2 === 0) continue;
      for (const [dx0, dy0] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x0 + dx0;
        const ny = y0 + dy0;
        if (nx < 0 || nx > X || ny < 0 || ny > Y || used.has(arc(x0, y0, dx0, dy0))) continue;
        const stops: KnotStop[] = [];
        let [x, y, dx, dy] = [x0, y0, dx0, dy0];
        do {
          used.add(arc(x, y, dx, dy));
          x += dx;
          y += dy;
          const wall = wallAt(x, y);
          // The checkerboard: which diagonal is on top flips from one crossing to the next.
          stops.push({ x, y, dx, dy, wall, over: wall === null && (x % 2 === 1) === (dx * dy > 0) });
          if (wall === "h") dy = -dy;
          if (wall === "v") dx = -dx;
        } while (!(x === x0 && y === y0 && dx === dx0 && dy === dy0));
        loops.push(stops);
      }
    }
  }
  return loops;
}

/** A closed strand as evenly indexed samples: stop `i` is at sample `i * SAMPLES_PER_STOP`. */
function centerline(stops: KnotStop[]): Point[] {
  const keys = stops.map((s) => {
    if (s.wall === "h") return { x: s.x, y: s.y - s.dy * WALL_CLEARANCE, tx: s.dx, ty: 0 };
    if (s.wall === "v") return { x: s.x - s.dx * WALL_CLEARANCE, y: s.y, tx: 0, ty: s.dy };
    return { x: s.x, y: s.y, tx: s.dx * Math.SQRT1_2, ty: s.dy * Math.SQRT1_2 };
  });
  const points: Point[] = [];
  keys.forEach((a, i) => {
    const b = keys[(i + 1) % keys.length];
    const reach = Math.hypot(b.x - a.x, b.y - a.y) * 0.4;
    const c1 = { x: a.x + a.tx * reach, y: a.y + a.ty * reach };
    const c2 = { x: b.x - b.tx * reach, y: b.y - b.ty * reach };
    for (let n = 0; n < SAMPLES_PER_STOP; n++) {
      const t = n / SAMPLES_PER_STOP;
      const u = 1 - t;
      points.push({
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      });
    }
  });
  return points;
}

/** The polyline one ribbon half-width to the left of travel (or right, with a negative distance). */
function offset(points: Point[], distance: number, closed = false): Point[] {
  const n = points.length;
  return points.map((p, i) => {
    const a = closed ? points[(i - 1 + n) % n] : points[Math.max(i - 1, 0)];
    const b = closed ? points[(i + 1) % n] : points[Math.min(i + 1, n - 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: p.x + ((b.y - a.y) / len) * distance, y: p.y - ((b.x - a.x) / len) * distance };
  });
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(p.x - a.x - vx * t, p.y - a.y - vy * t);
}

function distanceToLine(p: Point, line: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) best = Math.min(best, distanceToSegment(p, line[i - 1], line[i]));
  return best;
}

/** Drops the start of a ribbon until its square end clears the strand passing over it. */
function trimStart(center: Point[], over: Point[], radius: number, gap: number): Point[] {
  const clearAt = (i: number, t: number) => {
    const a = center[i];
    const b = center[i + 1];
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = ((b.y - a.y) / len) * radius;
    const ny = (-(b.x - a.x) / len) * radius;
    return [p, { x: p.x + nx, y: p.y + ny }, { x: p.x - nx, y: p.y - ny }].every((c) => distanceToLine(c, over) >= radius + gap);
  };
  for (let i = 0; i < center.length - 1; i++) {
    if (!clearAt(i, 1)) continue;
    // The end lands in this segment; narrow it down so the gap doesn't depend on the sample spacing.
    let low = 0;
    let high = 1;
    for (let step = 0; step < 12; step++) {
      const middle = (low + high) / 2;
      if (clearAt(i, middle)) high = middle;
      else low = middle;
    }
    const a = center[i];
    const b = center[i + 1];
    return [{ x: a.x + (b.x - a.x) * high, y: a.y + (b.y - a.y) * high }, ...center.slice(i + 1)];
  }
  return center;
}

const fmt = (n: number) => String(Number(n.toFixed(2)));
const toSvg = (p: Point) => `${fmt((p.x + MARGIN) * UNIT)} ${fmt((p.y + MARGIN) * UNIT)}`;
const openPath = (points: Point[]) => `M${points.map(toSvg).join("L")}`;
const closedPath = (points: Point[]) => `${openPath(points)}Z`;

/** Samples `from` to `to` on a closed strand, wrapping past the end. */
function slice(points: Point[], from: number, to: number): Point[] {
  const out: Point[] = [];
  for (let i = from; i <= to; i++) out.push(points[i % points.length]);
  return out;
}

type Traced = { stops: KnotStop[]; points: Point[] };

/** Where each crossing's two passes are, so a ribbon can find the strand it goes under. */
function overPasses(traced: Traced[]): Map<string, Point[]> {
  const over = new Map<string, Point[]>();
  for (const { stops, points } of traced) {
    stops.forEach((s, i) => {
      if (!s.wall && s.over) {
        const at = i * SAMPLES_PER_STOP + points.length;
        over.set(`${s.x},${s.y}`, slice(points, at - SAMPLES_PER_STOP, at + SAMPLES_PER_STOP));
      }
    });
  }
  return over;
}

/** One strand's ribbon centers, cut at each under-crossing so each piece holds one over-crossing. */
function ribbonRuns(strand: Traced, passes: Map<string, Point[]>, radius: number, gap: number): Point[][] {
  const { stops, points } = strand;
  const unders = stops.flatMap((s, i) => (!s.wall && !s.over ? [i] : []));
  return unders.map((from, n) => {
    const nextStop = unders[(n + 1) % unders.length];
    const to = nextStop > from ? nextStop : nextStop + stops.length;
    const center = slice(points, from * SAMPLES_PER_STOP, to * SAMPLES_PER_STOP);
    const start = passes.get(`${stops[from].x},${stops[from].y}`)!;
    const end = passes.get(`${stops[nextStop].x},${stops[nextStop].y}`)!;
    return trimStart(trimStart(center, start, radius, gap).reverse(), end, radius, gap).reverse();
  });
}

/** A ribbon piece as one closed outline: up its left edge, back down its right. */
function bandPath(center: Point[], radius: number): string {
  return closedPath([...offset(center, radius), ...offset(center, -radius).reverse()]);
}

/** A strand with no crossings: its two edges, wound opposite ways so the middle stays empty. */
function ringEdges({ points }: Traced, radius: number): [Point[], Point[]] {
  return [offset(points, radius, true), offset(points, -radius, true).reverse()];
}

function segmentHit(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;
  const cross = rx * sy - ry * sx;
  if (Math.abs(cross) < 1e-12) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / cross;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + rx * t, y: a.y + ry * t } : null;
}

/** A run of ribbon edge between two crossings, walked with the ribbon on its right. */
type EdgeRun = { edge: Point[]; next: number; startIndex: number; endIndex: number; startPoint?: Point; endPoint?: Point };

/**
 * The outline of the ribbons merged into one shape, for interlace off. Walking an edge
 * into a crossing, the boundary turns left onto the next arm's edge, which traces each
 * gap between ribbons exactly once. The winding keeps every gap a hole under either fill rule.
 */
function mergedOutlines(traced: Traced[], radius: number): Point[][] {
  const runs: EdgeRun[] = [];
  const pending: { run: number; x: number; y: number; dx: number; dy: number }[] = [];
  const outgoing = new Map<string, number>();
  const contours: Point[][] = [];

  const addRun = (center: Point[], from: KnotStop, to: KnotStop, sign: 1 | -1) => {
    const id = runs.length;
    const edge = offset(center, radius);
    runs.push({ edge, next: -1, startIndex: 0, endIndex: edge.length - 1 });
    const [start, end] = sign === 1 ? [from, to] : [to, from];
    outgoing.set(`${start.x},${start.y},${start.dx * sign},${start.dy * sign}`, id);
    pending.push({ run: id, x: end.x, y: end.y, dx: end.dx * sign, dy: end.dy * sign });
  };

  for (const strand of traced) {
    const { stops, points } = strand;
    const crossings = stops.flatMap((s, i) => (s.wall ? [] : [i]));
    if (!crossings.length) {
      contours.push(...ringEdges(strand, radius));
      continue;
    }
    crossings.forEach((from, n) => {
      const nextStop = crossings[(n + 1) % crossings.length];
      const to = nextStop > from ? nextStop : nextStop + stops.length;
      const center = slice(points, from * SAMPLES_PER_STOP, to * SAMPLES_PER_STOP);
      addRun(center, stops[from], stops[nextStop], 1);
      addRun([...center].reverse(), stops[from], stops[nextStop], -1);
    });
  }

  // Each join is where this run's edge meets the next arm's edge, close to the crossing.
  for (const { run, x, y, dx, dy } of pending) {
    const a = runs[run];
    const nextId = outgoing.get(`${x},${y},${dy},${-dx}`)!;
    const b = runs[nextId];
    a.next = nextId;
    search: for (let i = a.edge.length - 2; i >= a.edge.length >> 1; i--) {
      for (let j = 0; j < b.edge.length >> 1; j++) {
        const hit = segmentHit(a.edge[i], a.edge[i + 1], b.edge[j], b.edge[j + 1]);
        if (!hit) continue;
        a.endIndex = i;
        a.endPoint = hit;
        b.startIndex = j + 1;
        b.startPoint = hit;
        break search;
      }
    }
  }

  const done = new Set<number>();
  runs.forEach((_, first) => {
    if (done.has(first)) return;
    const contour: Point[] = [];
    let id = first;
    do {
      done.add(id);
      const run = runs[id];
      if (run.startPoint) contour.push(run.startPoint);
      contour.push(...run.edge.slice(run.startIndex, run.endIndex + 1));
      id = run.next;
    } while (id !== first);
    contours.push(contour);
  });
  return contours;
}

const strandColor = (req: CelticKnotRequest, index: number) => (req.perStrand ? req.colors[index % req.colors.length] : req.colors[0]);

/** Every output's paths for a request, in plain JSON. */
export function drawKnot(req: CelticKnotRequest, traced: Traced[]): KnotDrawing {
  const radius = req.ribbon / 200;
  const width = (req.cols * 2 + MARGIN * 2) * UNIT;
  const height = (req.rows * 2 + MARGIN * 2) * UNIT;
  const page = `M0 0H${fmt(width)}V${fmt(height)}H0Z`;
  const art: KnotShape[] = [{ d: page, fill: req.background }];
  const coloring: KnotShape[] = [{ d: page, fill: "#ffffff" }];
  const cut: KnotShape[] = [];
  const stencil: KnotShape[] = [];
  const stencilStyle = { stroke: "#000000", strokeWidth: STENCIL_WIDTH };

  if (req.interlace === "off") {
    // Flat ribbons: all outlines first, then all colors, so crossings show no over or under.
    const centers = traced.map((strand) => closedPath(strand.points));
    centers.forEach((d) => art.push({ d, stroke: req.outline, strokeWidth: radius * 2 * UNIT + OUTLINE_WIDTH * 2 }));
    centers.forEach((d, i) => art.push({ d, stroke: strandColor(req, i), strokeWidth: radius * 2 * UNIT }));
    const outlines = mergedOutlines(traced, radius);
    const merged = outlines.map(closedPath).join("");
    cut.push({ d: merged, fill: "#000000" });
    stencil.push({ d: merged, ...stencilStyle });
    coloring.push({ d: merged, fill: "#ffffff", stroke: "#000000", strokeWidth: COLORING_WIDTH });
    return { width, height, art, cut, stencil, coloring };
  }

  const gap = GAPS[req.interlace];
  const passes = overPasses(traced);
  traced.forEach((strand, index) => {
    const fill = strandColor(req, index);
    const closedRing = !strand.stops.some((s) => !s.wall);
    if (closedRing) {
      const ring = ringEdges(strand, radius).map(closedPath);
      const d = ring.join("");
      art.push({ d, fill, stroke: req.outline, strokeWidth: OUTLINE_WIDTH });
      cut.push({ d, fill: "#000000" });
      stencil.push({ d, ...stencilStyle });
      coloring.push({ d, fill: "#ffffff", stroke: "#000000", strokeWidth: COLORING_WIDTH });
      return;
    }
    for (const center of ribbonRuns(strand, passes, radius, gap)) {
      const d = bandPath(center, radius);
      art.push({ d, fill, stroke: req.outline, strokeWidth: OUTLINE_WIDTH });
      cut.push({ d, fill: "#000000" });
    }
    // Two separate lines per piece: leaving the ends open is what makes the stencil's gaps.
    for (const center of ribbonRuns(strand, passes, radius, Math.max(gap, STENCIL_GAP))) {
      stencil.push({ d: openPath(offset(center, radius)), ...stencilStyle });
      stencil.push({ d: openPath(offset(center, -radius)), ...stencilStyle });
    }
    // No gap on the coloring page: each piece's end sits on the edge of the strand above, giving closed areas to color.
    for (const center of ribbonRuns(strand, passes, radius, 0)) {
      coloring.push({ d: bandPath(center, radius), fill: "#ffffff", stroke: "#000000", strokeWidth: COLORING_WIDTH });
    }
  });
  return { width, height, art, cut, stencil, coloring };
}

function toSvgFile(shapes: KnotShape[], width: number, height: number, size: number, title: string): string {
  const scale = size / Math.max(width, height);
  const body = shapes
    .map((s) => {
      const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${fmt(s.strokeWidth ?? 1)}" stroke-linejoin="round"` : "";
      return `<path d="${s.d}" fill="${s.fill ?? "none"}"${stroke}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${Number((width * scale).toFixed(3))}in" height="${Number((height * scale).toFixed(3))}in" role="img"><title>${title}</title>${body}</svg>`;
}

/** The strands and breaks for a request, which the SVG and the PDF both draw from. */
export function traceKnot(req: CelticKnotRequest) {
  const breaks = placeBreaks(req.cols, req.rows, req.pattern, req.seed, req.density);
  const traced = traceStrands(req.cols, req.rows, breaks).map((stops) => ({ stops, points: centerline(stops) }));
  return { breaks, traced };
}

export function generateCelticKnot(req: CelticKnotRequest): CelticKnotResult {
  const locale = req.locale ?? "en";
  const { breaks, traced } = traceKnot(req);
  const drawing = drawKnot(req, traced);
  const { width, height } = drawing;
  const file = (shapes: KnotShape[], key: Phrase) => toSvgFile(shapes, width, height, req.size, knotSay(locale, key));
  const visits = traced.map((t) => t.stops.filter((s) => !s.wall).length);
  return {
    svg: {
      art: file(drawing.art, "svgArt"),
      cut: file(drawing.cut, "svgCut"),
      stencil: file(drawing.stencil, "svgStencil"),
      coloring: file(drawing.coloring, "svgColoring"),
    },
    strands: traced.length,
    crossings: visits.reduce((sum, n) => sum + n, 0) / 2,
    breaks: breaks.length,
    pieces: drawing.cut.length,
    strandList: traced.map((_, index) => ({ index, color: strandColor(req, index), crossings: visits[index] })),
    steps: [knotSay(locale, req.interlace === "off" ? "stepCutMerged" : "stepCutPieces"), knotSay(locale, "stepStencil"), knotSay(locale, "stepColoring"), knotSay(locale, "stepSize", { size: req.size })],
  };
}
