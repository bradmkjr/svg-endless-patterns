import { inches } from "./format";
import type { Locale } from "./i18n";
import messages from "./messages/sashiko.json";

export const SASHIKO_MOTIFS = ["asanoha", "seigaiha", "shippo", "kikko", "kagome", "squares", "diamonds"] as const;
export type SashikoMotif = (typeof SASHIKO_MOTIFS)[number];

export type SashikoRequest = {
  motif: SashikoMotif;
  /** The motif's grid size in inches. What it measures depends on the motif: see `motifTile`. */
  spacing: number;
  /** Length of one stitch on the right side, in inches. */
  stitch: number;
  /** Finished panel, in inches. */
  width: number;
  height: number;
  cloth: string;
  thread: string;
  locale?: Locale;
};

export type SashikoResult = {
  svg: { panel: string };
  motif: string;
  width: string;
  height: string;
  spacing: string;
  stitch: string;
  gap: string;
  stitches: number;
  threadYards: number;
  sheets: number;
  /** Many lines here are shorter than one stitch and gap, so the stitches shrink to fit. */
  tight: boolean;
  steps: string[];
};

/** A straight line, or a circular arc running from angle `a0` up to `a1` (radians; y points down). */
export type Stroke = { kind: "line"; x1: number; y1: number; x2: number; y2: number } | { kind: "arc"; cx: number; cy: number; r: number; a0: number; a1: number };

/** One line from node to node, and the stitches on it. */
export type SashikoRun = { stroke: Stroke; length: number; dashes: Stroke[] };

/** Gaps two-thirds of a stitch: three parts stitch to two parts gap, a proportion to start from, not a rule. */
const GAP_RATIO = 2 / 3;
/** Extra thread for starts, stops and turns. A rough allowance. */
const THREAD_ALLOWANCE = 1.2;
const EPS = 1e-7;
const TAU = Math.PI * 2;

export function sashikoText(locale: Locale, key: keyof (typeof messages)["en"], values: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

const line = (x1: number, y1: number, x2: number, y2: number): Stroke => ({ kind: "line", x1, y1, x2, y2 });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number): Stroke => ({ kind: "arc", cx, cy, r, a0, a1 });

export const strokeLength = (s: Stroke) => (s.kind === "line" ? Math.hypot(s.x2 - s.x1, s.y2 - s.y1) : s.r * (s.a1 - s.a0));

/** The point a fraction `t` of the way along a stroke. */
export function pointAt(s: Stroke, t: number): [number, number] {
  if (s.kind === "line") return [s.x1 + (s.x2 - s.x1) * t, s.y1 + (s.y2 - s.y1) * t];
  const a = s.a0 + (s.a1 - s.a0) * t;
  return [s.cx + s.r * Math.cos(a), s.cy + s.r * Math.sin(a)];
}

/** The part of a stroke between two fractions of its length. */
function slice(s: Stroke, t0: number, t1: number): Stroke {
  if (s.kind === "arc") return arc(s.cx, s.cy, s.r, s.a0 + (s.a1 - s.a0) * t0, s.a0 + (s.a1 - s.a0) * t1);
  const [x1, y1] = pointAt(s, t0);
  const [x2, y2] = pointAt(s, t1);
  return line(x1, y1, x2, y2);
}

function shift(s: Stroke, dx: number, dy: number): Stroke {
  return s.kind === "line" ? line(s.x1 + dx, s.y1 + dy, s.x2 + dx, s.y2 + dy) : arc(s.cx + dx, s.cy + dy, s.r, s.a0, s.a1);
}

/** Where two circles meet: one point if they just touch. */
function circlesMeet(ax: number, ay: number, ar: number, bx: number, by: number, br: number): [number, number][] {
  const d = Math.hypot(bx - ax, by - ay);
  if (d < EPS || d > ar + br + EPS || d < Math.abs(ar - br) - EPS) return [];
  const along = (d * d + ar * ar - br * br) / (2 * d);
  const off = Math.sqrt(Math.max(0, ar * ar - along * along));
  const mx = ax + ((bx - ax) * along) / d;
  const my = ay + ((by - ay) * along) / d;
  const px = ((by - ay) * off) / d;
  const py = ((bx - ax) * off) / d;
  return off < 1e-5 ? [[mx, my]] : [[mx + px, my - py], [mx - px, my + py]];
}

/**
 * One repeat of a motif: the rectangle it fills and the lines in it, each once.
 * Lines may run outside the rectangle; repeating them must not draw any line twice.
 *
 * Spacing `s` measures:
 * - squares: the side of a square
 * - diamonds: a diamond's width and height
 * - kikko: a hexagon's width, flat side to flat side
 * - asanoha: the side of a large triangle, the distance between neighboring star centers
 * - kagome: the side of a triangle, which is also the side of a hexagon
 * - seigaiha: the width of a scale
 * - shippo: the diameter of a circle
 */
export function motifTile(motif: SashikoMotif, s: number): { width: number; height: number; strokes: Stroke[] } {
  const h = (s * Math.sqrt(3)) / 2;
  switch (motif) {
    case "squares":
      return { width: s, height: s, strokes: [line(0, 0, s, 0), line(0, 0, 0, s)] };
    case "diamonds":
      return { width: s, height: s, strokes: [line(0, 0, s, s), line(s, 0, 0, s)] };
    case "kikko": {
      // Two rows of pointy-topped hexagons, a half step apart. `a` is the hexagon's side.
      const a = s / Math.sqrt(3);
      return {
        width: s,
        height: 3 * a,
        strokes: [
          line(0, a / 2, 0, (3 * a) / 2),
          line(s / 2, 2 * a, s / 2, 3 * a),
          line(s / 2, 0, 0, a / 2),
          line(s / 2, 0, s, a / 2),
          line(0, (3 * a) / 2, s / 2, 2 * a),
          line(s, (3 * a) / 2, s / 2, 2 * a),
        ],
      };
    }
    case "asanoha": {
      // A triangle grid, with each triangle's corners joined to its center.
      const triangles: [number, number, number, number, number, number][] = [
        [0, 0, s, 0, s / 2, h],
        [s / 2, h, 0, 2 * h, s, 2 * h],
        [0, 0, s / 2, h, -s / 2, h],
        [0, 2 * h, s / 2, h, -s / 2, h],
      ];
      return {
        width: s,
        height: 2 * h,
        strokes: [
          line(0, 0, s, 0),
          line(s / 2, h, (3 * s) / 2, h),
          line(0, 0, s / 2, h),
          line(s, 0, s / 2, h),
          line(s / 2, h, 0, 2 * h),
          line(s / 2, h, s, 2 * h),
          ...triangles.flatMap(([x1, y1, x2, y2, x3, y3]) => {
            const cx = (x1 + x2 + x3) / 3;
            const cy = (y1 + y2 + y3) / 3;
            return [line(cx, cy, x1, y1), line(cx, cy, x2, y2), line(cx, cy, x3, y3)];
          }),
        ],
      };
    }
    case "kagome":
      // Three sets of parallel lines. Sloped lines meet on the rows between the level ones.
      return { width: 2 * s, height: 4 * h, strokes: [line(0, 0, 2 * s, 0), line(0, 2 * h, 2 * s, 2 * h), line(0, 0, 2 * s, 4 * h), line(s, 0, -s, 4 * h)] };
    case "shippo": {
      // Circles whose four neighbors each overlap them, cutting them into quarter arcs.
      const r = s / 2;
      const quarters = (cx: number, cy: number) => [0, 1, 2, 3].map((q) => arc(cx, cy, r, (q * Math.PI) / 2, ((q + 1) * Math.PI) / 2));
      return { width: s, height: s, strokes: [...quarters(0, 0), ...quarters(r, r)] };
    }
    case "seigaiha": {
      // Rows of concentric rings, each row half a radius below the last and hiding the
      // lower part of the row behind it. A ring shows down to where it meets the outer
      // ring of the scale in front, down and to the right; the left is its mirror image.
      const r = s / 2;
      const rings = [r, (2 * r) / 3, r / 3].map((ring) => {
        const [x, y] = circlesMeet(0, 0, ring, r, r / 2, r).find((p) => p[1] < 0)!;
        const right = Math.atan2(y, x);
        return { ring, left: -Math.PI - right, right };
      });
      const scale = (cx: number, cy: number) => rings.map(({ ring, left, right }) => arc(cx, cy, ring, left, right));
      return { width: s, height: r, strokes: [...scale(0, 0), ...scale(r, r / 2)] };
    }
  }
}

const inArc = (s: Extract<Stroke, { kind: "arc" }>, angle: number) => {
  const off = ((angle - s.a0) % TAU + TAU) % TAU;
  const tol = 1e-6 / s.r;
  return off <= s.a1 - s.a0 + tol || off >= TAU - tol;
};

/** Fractions along `a` where `b` touches it. No motif mixes lines and arcs, so that case is left out. */
function touches(a: Stroke, b: Stroke): number[] {
  if (a.kind === "line" && b.kind === "line") {
    const ax = a.x2 - a.x1;
    const ay = a.y2 - a.y1;
    const bx = b.x2 - b.x1;
    const by = b.y2 - b.y1;
    const cross = ax * by - ay * bx;
    if (Math.abs(cross) < EPS) return [];
    const t = ((b.x1 - a.x1) * by - (b.y1 - a.y1) * bx) / cross;
    const u = ((b.x1 - a.x1) * ay - (b.y1 - a.y1) * ax) / cross;
    return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS ? [t] : [];
  }
  if (a.kind === "arc" && b.kind === "arc") {
    return circlesMeet(a.cx, a.cy, a.r, b.cx, b.cy, b.r)
      .map(([x, y]) => ({ forA: Math.atan2(y - a.cy, x - a.cx), forB: Math.atan2(y - b.cy, x - b.cx) }))
      .filter(({ forA, forB }) => inArc(a, forA) && inArc(b, forB))
      .map(({ forA }) => (((forA - a.a0) % TAU + TAU) % TAU) / (a.a1 - a.a0));
  }
  return [];
}

/** A motif's lines, cut at every crossing with the repeats around them. */
function tileRuns(motif: SashikoMotif, spacing: number): Stroke[] {
  const { width, height, strokes } = motifTile(motif, spacing);
  const around: Stroke[] = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const s of strokes) around.push(shift(s, i * width, j * height));
  return strokes.flatMap((s) => {
    const cuts = [0, 1];
    for (const other of around) {
      for (const t of touches(s, other)) if (t > 1e-6 && t < 1 - 1e-6 && !cuts.some((c) => Math.abs(c - t) < 1e-6)) cuts.push(t);
    }
    cuts.sort((a, b) => a - b);
    return cuts.slice(1).map((t, i) => slice(s, cuts[i], t));
  });
}

/** The part or parts of a stroke inside the panel. Lines lying on its edge are left out. */
function clipToPanel(s: Stroke, width: number, height: number): Stroke[] {
  const edges: number[] = [0, 1];
  if (s.kind === "line") {
    for (const [from, to, limit] of [[s.x1, s.x2, 0], [s.x1, s.x2, width], [s.y1, s.y2, 0], [s.y1, s.y2, height]]) {
      if (Math.abs(to - from) > EPS) edges.push((limit - from) / (to - from));
    }
  } else {
    for (const [center, limit, base] of [[s.cx, 0, 0], [s.cx, width, 0], [s.cy, 0, Math.PI / 2], [s.cy, height, Math.PI / 2]]) {
      const ratio = (limit - center) / s.r;
      if (Math.abs(ratio) > 1) continue;
      for (const angle of [base + Math.acos(ratio), base - Math.acos(ratio)]) {
        const off = ((angle - s.a0) % TAU + TAU) % TAU;
        edges.push(off / (s.a1 - s.a0));
      }
    }
  }
  const cuts = [...new Set(edges.filter((t) => t >= 0 && t <= 1))].sort((a, b) => a - b);
  const kept: Stroke[] = [];
  cuts.slice(1).forEach((t1, i) => {
    const t0 = cuts[i];
    if (t1 - t0 < 1e-9) return;
    const [mx, my] = pointAt(s, (t0 + t1) / 2);
    const onEdge = mx < EPS || my < EPS || mx > width - EPS || my > height - EPS;
    if (!onEdge) kept.push(slice(s, t0, t1));
  });
  return kept;
}

/**
 * Stitches along one line. Whole units of stitch and gap fill it exactly, each stitch
 * centered in its unit, so half a gap falls at each end: where two lines cross, both
 * have a gap and the stitches can't cross.
 */
export function stitchesOn(stroke: Stroke, stitch: number): Stroke[] {
  const unit = stitch * (1 + GAP_RATIO);
  const length = strokeLength(stroke);
  const count = Math.max(1, Math.round(length / unit));
  const part = 1 / count;
  const dash = part / (1 + GAP_RATIO);
  return Array.from({ length: count }, (_, i) => {
    const center = (i + 0.5) * part;
    return slice(stroke, center - dash / 2, center + dash / 2);
  });
}

/** Every line on the panel and its stitches. The motif is centered, so opposite edges match. */
export function sashikoRuns(req: Pick<SashikoRequest, "motif" | "spacing" | "stitch" | "width" | "height">): SashikoRun[] {
  const { width: tileW, height: tileH } = motifTile(req.motif, req.spacing);
  const base = tileRuns(req.motif, req.spacing);
  const offX = (req.width / 2) % tileW;
  const offY = (req.height / 2) % tileH;
  const runs: SashikoRun[] = [];
  // Lines can reach past their own repeat, so start and finish a repeat or two beyond the panel.
  for (let i = -2; offX + i * tileW < req.width + tileW; i++) {
    for (let j = -2; offY + j * tileH < req.height + tileH; j++) {
      for (const run of base) {
        const placed = shift(run, offX + i * tileW, offY + j * tileH);
        const whole = strokeLength(placed);
        for (const stroke of clipToPanel(placed, req.width, req.height)) {
          const length = strokeLength(stroke);
          // A sliver cut off by the panel's edge is too small to stitch.
          if (length < whole - 1e-6 && length < req.stitch) continue;
          runs.push({ stroke, length, dashes: stitchesOn(stroke, req.stitch) });
        }
      }
    }
  }
  return runs;
}

/** Letter paper: the stitch area of a sheet, and how much neighboring sheets share. */
export const SHEET_WIDTH = 7.5;
export const SHEET_HEIGHT = 8.5;
export const SHEET_OVERLAP = 0.5;

export type SashikoSheet = { col: number; row: number; x: number; y: number; width: number; height: number };

function sheetStarts(size: number, sheet: number): number[] {
  const step = sheet - SHEET_OVERLAP;
  const count = size <= sheet ? 1 : Math.ceil((size - sheet) / step) + 1;
  return Array.from({ length: count }, (_, i) => i * step);
}

/** Which part of the panel each printed sheet shows, row by row. */
export function sashikoSheets(width: number, height: number): SashikoSheet[] {
  return sheetStarts(height, SHEET_HEIGHT).flatMap((y, row) =>
    sheetStarts(width, SHEET_WIDTH).map((x, col) => ({ col, row, x, y, width: Math.min(SHEET_WIDTH, width - x), height: Math.min(SHEET_HEIGHT, height - y) })),
  );
}

const n = (value: number) => Number(value.toFixed(3));

export function strokePath(s: Stroke): string {
  const [x1, y1] = pointAt(s, 0);
  const [x2, y2] = pointAt(s, 1);
  if (s.kind === "line") return `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
  return `M${n(x1)} ${n(y1)}A${n(s.r)} ${n(s.r)} 0 ${s.a1 - s.a0 > Math.PI ? 1 : 0} 1 ${n(x2)} ${n(y2)}`;
}

function panelSvg(req: SashikoRequest, runs: SashikoRun[]): string {
  const d = runs.map((run) => run.dashes.map(strokePath).join("")).join("");
  // Stroke width: a thread's rough width on the cloth, at the panel's true size.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${req.width} ${req.height}" width="${req.width}in" height="${req.height}in" role="img"><title>Sashiko stitch guide</title><rect width="${req.width}" height="${req.height}" fill="${req.cloth}"/><path d="${d}" fill="none" stroke="${req.thread}" stroke-width="0.035" stroke-linecap="round"/></svg>`;
}

/** Stitch sizes fall on sixteenths, finer than the eighths `inches` rounds to. */
function sixteenths(value: number): string {
  const count = Math.max(1, Math.round(value * 16));
  const exact = Math.abs(value * 16 - count) < 1e-6;
  const label = count % 2 === 0 ? inches(count / 16) : `${count}/16`;
  return `${exact ? "" : "~"}${label}`;
}

export function generateSashiko(req: SashikoRequest): SashikoResult {
  const locale = req.locale ?? "en";
  const runs = sashikoRuns(req);
  const unit = req.stitch * (1 + GAP_RATIO);
  const total = runs.reduce((sum, run) => sum + run.length, 0);
  const sheets = sashikoSheets(req.width, req.height).length;
  const short = runs.filter((run) => run.length < unit * 0.75).length;
  return {
    svg: { panel: panelSvg(req, runs) },
    motif: sashikoText(locale, `motif_${req.motif}`),
    width: inches(req.width),
    height: inches(req.height),
    spacing: inches(req.spacing),
    stitch: sixteenths(req.stitch),
    gap: sixteenths(req.stitch * GAP_RATIO),
    stitches: runs.reduce((sum, run) => sum + run.dashes.length, 0),
    threadYards: Math.ceil((total * THREAD_ALLOWANCE) / 36),
    sheets,
    tight: short > runs.length / 4,
    steps: [
      sashikoText(locale, "stepPrint"),
      ...(sheets > 1 ? [sashikoText(locale, "stepJoin", { sheets, overlap: inches(SHEET_OVERLAP) })] : []),
      sashikoText(locale, "stepTransfer"),
      sashikoText(locale, "stepStitch", { stitch: sixteenths(req.stitch), gap: sixteenths(req.stitch * GAP_RATIO) }),
      sashikoText(locale, "stepFinish"),
    ],
  };
}
