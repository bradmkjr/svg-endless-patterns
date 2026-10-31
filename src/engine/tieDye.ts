import type { Locale } from "./i18n";
import text from "./messages/tieDye.json";

/**
 * Tie-dye as dye on cloth. Each fold gives every point of the fabric a strength for each
 * dye, and those are traced into flat tones that multiply together, as dye does on fabric.
 * All vector, so the SVG, PNG and PDF come from the same shapes.
 */

export const TECHNIQUES = ["spiral", "bullseye", "accordion"] as const;
export type TieDyeTechnique = (typeof TECHNIQUES)[number];

export type TieDyeRequest = {
  technique: TieDyeTechnique;
  /** Wedges of a spiral, rings of a bullseye, or twice the folds of an accordion. */
  bands: number;
  /** One to four dyes. */
  dyes: string[];
  fabric: string;
  /** The same seed always gives the same design. */
  seed: number;
  /** Adult T-shirts, for the mixing amounts. */
  garments: number;
  /** Teaspoons of dye powder per cup of water, from the dye's label. */
  strength: number;
  locale?: Locale;
};

export type TieDyeMix = { letter: string; color: string; ounces: number; teaspoons: number; ureaTablespoons: number };
export type TieDyeLayer = { fill: string; d: string };
/** A diagram's plain shapes, shared by the SVG and the PDF. */
export type TieDyeGuideShape = { d: string; fill?: string; stroke?: string; strokeWidth?: number };
export type TieDyeGuideLabel = { x: number; y: number; text: string };
export type TieDyeGuide = { shapes: TieDyeGuideShape[]; labels: TieDyeGuideLabel[] };

export type TieDyeResult = {
  svg: { art: string; guide: string };
  technique: TieDyeTechnique;
  layers: number;
  mix: TieDyeMix[];
  /** Cups of soda ash and gallons of water, for a soak. */
  steps: { fold: string[]; apply: string[]; soak: string[]; cure: string[]; safety: string[] };
};

type Phrase = keyof typeof text.en;

export const CANVAS = 1000;
export const GUIDE_WIDTH = 1000;
export const GUIDE_HEIGHT = 480;
/** Liquid dye an adult T-shirt takes up, in ounces, from Dharma Trading's tie-dye instructions. */
const OUNCES_PER_SHIRT = 4;
const OUNCES_PER_CUP = 8;
const UREA_TBSP_PER_CUP = 1;
const SIZE_INCHES = 8;
const GRID = 450;
const LEVELS = 4;
const TOLERANCE = 0.55;
const MIN_AREA = 3;
const TAU = Math.PI * 2;
const INK = "#25221c";

export function tieDyeSay(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  return text[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A small seeded generator (mulberry32), so a seed means the same design on every machine. */
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

/** 3D value noise, so a circle can be sampled without a seam. */
function makeNoise(seed: number) {
  const random = seededRandom(seed);
  const table = Float64Array.from({ length: 4096 }, () => random() * 2 - 1);
  const at = (x: number, y: number, z: number) => table[(Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) & 4095];
  const ease = (t: number) => t * t * (3 - 2 * t);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const noise = (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = ease(x - xi);
    const v = ease(y - yi);
    const w = ease(z - zi);
    return mix(
      mix(mix(at(xi, yi, zi), at(xi + 1, yi, zi), u), mix(at(xi, yi + 1, zi), at(xi + 1, yi + 1, zi), u), v),
      mix(mix(at(xi, yi, zi + 1), at(xi + 1, yi, zi + 1), u), mix(at(xi, yi + 1, zi + 1), at(xi + 1, yi + 1, zi + 1), u), v),
      w,
    );
  };
  return (x: number, y: number, z = 0, octaves = 4) => {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      sum += amplitude * noise(x * frequency + i * 17.3, y * frequency - i * 9.1, z * frequency + i * 4.7);
      amplitude *= 0.5;
      frequency *= 2.03;
    }
    return sum;
  };
}

const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (a: number, b: number, t: number) => {
  const k = clamp((t - a) / (b - a));
  return k * k * (3 - 2 * k);
};
/** Accordion folding reflects the cloth into one layer: where in that layer a point lands, 0 to 1. */
const foldLayer = (t: number) => {
  const f = t - Math.floor(t / 2) * 2;
  return f < 1 ? f : 2 - f;
};
export const accordionFolds = (bands: number) => Math.max(2, Math.round(bands / 2));

/** A field fills `out` with each dye's strength at a point; x and y run from -1 to 1 across the cloth. */
type Field = (x: number, y: number, out: Float64Array) => void;

/**
 * Twisted about the center and bound into wedges. A wedge in the folded cloth is a spiral arm
 * on the opened cloth: phi = theta + turns * r^0.72. White veins follow the arms, and pleats
 * crossing the ties give the serrated edge.
 */
function spiralField(req: TieDyeRequest): Field {
  const fbm = makeNoise(req.seed);
  const wedges = req.bands;
  const k = req.dyes.length;
  const turns = 1.15;
  return (x, y, out) => {
    const r = Math.hypot(x, y);
    const phi = Math.atan2(y, x) + TAU * turns * Math.pow(r, 0.72);
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    const wobble = 0.3 * fbm(r * 3, c * 1.2, s * 1.2, 3);
    const tooth = r * 26 + 0.9 * fbm(r * 6, c * 3, s * 3, 2);
    const serration = (0.2 + 0.16 * r) * (Math.abs(((tooth % 1) + 1) % 1 - 0.5) - 0.25) + 0.12 * fbm(r * 40, c * 6, s * 6, 2);
    const w = (((phi / TAU) * wedges + wobble + serration) % wedges + wedges) % wedges;
    const gate = smooth(-0.12, 0.2, fbm(r * 5, c * 2.4, s * 2.4, 2));
    const vein = smooth(0.14, 0.36, Math.abs(fbm(r * 2.2, c * 15, s * 15, 3)) * 1.15) * 0.85 * gate;
    const center = smooth(0, 0.1, r);
    out.fill(0);
    for (let i = 0; i < wedges; i++) {
      const d = Math.abs((((w - i - 0.5) % wedges) + wedges * 1.5) % wedges - wedges / 2);
      const strength = 1 - smooth(0.26, 0.56, d);
      if (strength > 0) out[i % k] = Math.max(out[i % k], strength * (1 - vein) * center);
    }
  };
}

/**
 * Pinched at the center, pulled into a cone and tied at intervals. Pleats run outward, so edges
 * feather in fine radial streaks: noise is fast around the circle and slow across it.
 */
function bullseyeField(req: TieDyeRequest): Field {
  const fbm = makeNoise(req.seed);
  const k = req.dyes.length;
  const rings = req.bands;
  return (x, y, out) => {
    const r = Math.hypot(x, y);
    const angle = Math.atan2(y, x);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const slow = 0.55 * fbm(c * 1.3, s * 1.3, r * 0.8, 3);
    const streak = 0.75 * fbm(c * 26, s * 26, r * 2.4, 3);
    const q = Math.pow(r, 0.9) * rings + (slow + streak * smooth(0.02, 0.2, r)) * smooth(0, 0.12, r);
    const ring = Math.floor(q);
    const f = q - ring;
    const fine = 1 - 0.45 * smooth(0.04, 0.3, Math.abs(fbm(c * 60, s * 60, r * 5, 2)));
    const dye = ((ring % k) + k) % k;
    out.fill(0);
    out[dye] = smooth(0, 0.16, Math.min(f, 1 - f)) * (0.45 + 0.55 * fine);
    // Dye wicks across a tie where it's loose, so neighbors overlap a little.
    const next = (dye + 1) % k;
    out[next] = Math.max(out[next], (1 - smooth(0, 0.1, 1 - f)) * 0.5);
  };
}

/**
 * Folded both ways and clamped between boards. The cloth lands in one layer of the stack, and the
 * board keeps its area white. Each layer soaks a little differently, so the mirroring isn't perfect.
 */
function accordionField(req: TieDyeRequest): Field {
  const fbm = makeNoise(req.seed);
  const folds = accordionFolds(req.bands);
  const random = seededRandom(req.seed ^ 0x5bd1);
  const depth = Float64Array.from({ length: 256 }, () => 0.72 + random() * 0.28);
  const k = req.dyes.length;
  return (x, y, out) => {
    const fx = (x + 1) * folds;
    const fy = (y + 1) * folds;
    const seep = depth[(Math.floor(fx) + Math.floor(fy) * 16) & 255];
    let u = foldLayer(fx);
    let v = foldLayer(fy);
    if (v > u) [u, v] = [v, u];
    const n = 0.12 * fbm(x * 9, y * 9, 0, 4) + 0.05 * fbm(x * 45, y * 45, 3, 2);
    const corner = (cx: number, cy: number, radius: number) => (1 - smooth(-0.1, 0.11, Math.hypot(cx - u, cy - v) - radius + n * 1.3)) * seep;
    out.fill(0);
    out[0] = smooth(-0.03, 0.2, Math.hypot(u - 0.42, v) - 0.31 + n) * seep;
    if (k > 1) out[1] = corner(1, 1, 0.34);
    if (k > 2) out[2] = corner(1, 0, 0.3);
    if (k > 3) out[3] = corner(0, 0, 0.2);
  };
}

const FIELDS: Record<TieDyeTechnique, (req: TieDyeRequest) => Field> = { spiral: spiralField, bullseye: bullseyeField, accordion: accordionField };

function sample(req: TieDyeRequest): Float32Array[] {
  const field = FIELDS[req.technique](req);
  const k = req.dyes.length;
  const grids = Array.from({ length: k }, () => new Float32Array(GRID * GRID));
  const out = new Float64Array(k);
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      field(((i + 0.5) / GRID) * 2 - 1, ((j + 0.5) / GRID) * 2 - 1, out);
      for (let d = 0; d < k; d++) grids[d][j * GRID + i] = out[d];
    }
  }
  return grids;
}

type Point = [number, number];

/** Marching squares: closed outlines at one strength, with the dyed side kept on the left. */
function contours(grid: Float32Array, level: number): Point[][] {
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= GRID || j >= GRID ? 0 : grid[j * GRID + i]);
  const W = GRID + 3;
  // Each crossed lattice edge has one id and is shared by exactly two cells.
  const across = (i: number, j: number) => ((j + 1) * W + (i + 1)) * 2;
  const down = (i: number, j: number) => ((j + 1) * W + (i + 1)) * 2 + 1;
  const points = new Map<number, Point>();
  const links = new Map<number, number[]>();
  const link = (p: number, q: number) => {
    if (!links.has(p)) links.set(p, []);
    if (!links.has(q)) links.set(q, []);
    links.get(p)!.push(q);
    links.get(q)!.push(p);
  };
  const cross = (a: number, b: number) => (level - a) / (b - a);
  for (let j = -1; j < GRID; j++) {
    for (let i = -1; i < GRID; i++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      const index = (a >= level ? 8 : 0) | (b >= level ? 4 : 0) | (c >= level ? 2 : 0) | (d >= level ? 1 : 0);
      if (index === 0 || index === 15) continue;
      const T = across(i, j);
      const B = across(i, j + 1);
      const L = down(i, j);
      const R = down(i + 1, j);
      if (a >= level !== b >= level) points.set(T, [i + cross(a, b), j]);
      if (d >= level !== c >= level) points.set(B, [i + cross(d, c), j + 1]);
      if (a >= level !== d >= level) points.set(L, [i, j + cross(a, d)]);
      if (b >= level !== c >= level) points.set(R, [i + 1, j + cross(b, c)]);
      if (index === 1 || index === 14) link(B, L);
      else if (index === 2 || index === 13) link(R, B);
      else if (index === 3 || index === 12) link(R, L);
      else if (index === 4 || index === 11) link(T, R);
      else if (index === 6 || index === 9) link(T, B);
      else if (index === 7 || index === 8) link(T, L);
      else if (index === 5) {
        link(T, L);
        link(B, R);
      } else {
        link(T, R);
        link(B, L);
      }
    }
  }
  const seen = new Set<number>();
  const loops: Point[][] = [];
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop: Point[] = [];
    let previous = -1;
    let current: number | undefined = start;
    while (current !== undefined && !seen.has(current)) {
      seen.add(current);
      loop.push(points.get(current)!);
      const [first, second]: number[] = links.get(current)!;
      const next: number = first !== previous ? first : second;
      previous = current;
      current = next;
    }
    if (loop.length < 3) continue;
    // Every segment votes on which side is dyed: one sample can land across a neighboring outline.
    let vote = 0;
    for (let q = 0; q < loop.length; q++) {
      const [ax, ay] = loop[q];
      const [bx, by] = loop[(q + 1) % loop.length];
      const length = Math.hypot(bx - ax, by - ay) || 1;
      const sx = (ax + bx) / 2 + ((by - ay) / length) * 0.08;
      const sy = (ay + by) / 2 - ((bx - ax) / length) * 0.08;
      const fx = Math.floor(sx);
      const fy = Math.floor(sy);
      const tx = sx - fx;
      const ty = sy - fy;
      const value = (at(fx, fy) * (1 - tx) + at(fx + 1, fy) * tx) * (1 - ty) + (at(fx, fy + 1) * (1 - tx) + at(fx + 1, fy + 1) * tx) * ty;
      vote += value >= level ? 1 : -1;
    }
    if (vote < 0) loop.reverse();
    loops.push(loop);
  }
  return loops;
}

/** Ramer-Douglas-Peucker, to keep the files small. */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: Point[] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy || 1;
    let worst = 0;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const t = clamp(((points[i][0] - ax) * dx + (points[i][1] - ay) * dy) / length);
      const ex = ax + t * dx - points[i][0];
      const ey = ay + t * dy - points[i][1];
      const error = ex * ex + ey * ey;
      if (error > worst) {
        worst = error;
        index = i;
      }
    }
    if (worst > tolerance * tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function area(points: Point[]): number {
  let sum = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    sum += p[0] * q[1] - q[0] * p[1];
  });
  return Math.abs(sum) / 2;
}

/** Whole-number relative lines: the smallest text pdf-lib's path parser still accepts. */
function loopPath(points: Point[], scale: number): string {
  const place = (v: number) => Math.round((v + 0.5) * scale);
  let px = place(points[0][0]);
  let py = place(points[0][1]);
  const start = `M${px} ${py}l`;
  const parts: string[] = [];
  for (const [x, y] of points.slice(1).map(([a, b]): Point => [place(a), place(b)])) {
    if (x === px && y === py) continue;
    parts.push(`${x - px} ${y - py}`);
    px = x;
    py = y;
  }
  return parts.length ? `${start}${parts.join(" ")}z` : "";
}

/** Flat tones, each scaled so a multiply stack reproduces the dye's color at each strength. */
export function tieDyeLayers(req: TieDyeRequest): TieDyeLayer[] {
  const grids = sample(req);
  const scale = CANVAS / GRID;
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return req.dyes.flatMap((dye, d) => {
    const rgb = channels(dye);
    const strength = (t: number) => rgb.map((c) => 1 - t * (1 - c));
    return Array.from({ length: LEVELS }, (_, level): TieDyeLayer | null => {
      const below = strength(level / LEVELS);
      const here = strength((level + 1) / LEVELS);
      const fill = `#${here.map((c, i) => Math.min(255, Math.round((c / below[i]) * 255)).toString(16).padStart(2, "0")).join("")}`;
      const path = contours(grids[d], (level + 0.5) / LEVELS)
        .filter((loop) => area(loop) >= MIN_AREA)
        .map((loop) => loopPath(simplify(loop, TOLERANCE), scale))
        .join("");
      return path ? { fill, d: path } : null;
    }).filter((layer): layer is TieDyeLayer => layer !== null);
  });
}

const letterOf = (i: number) => String.fromCharCode(65 + i);
const round = (n: number) => Number(n.toFixed(2));

function circle(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/** On the left, how to fold and tie. On the right, where each dye goes, by letter. */
export function tieDyeGuide(req: TieDyeRequest): TieDyeGuide {
  const shapes: TieDyeGuideShape[] = [];
  const labels: TieDyeGuideLabel[] = [];
  const line = { stroke: INK, strokeWidth: 3 };
  const k = req.dyes.length;
  const C = 240;
  const R = 200;
  const MAP = 760;
  if (req.technique === "spiral") {
    const ties = Math.ceil(req.bands / 2);
    shapes.push({ d: circle(C, C, R), fill: "#ffffff", ...line });
    for (let i = 0; i < ties; i++) {
      const a = (i / ties) * Math.PI;
      shapes.push({ d: `M ${round(C - R * Math.cos(a))} ${round(C - R * Math.sin(a))} L ${round(C + R * Math.cos(a))} ${round(C + R * Math.sin(a))}`, ...line });
    }
    const swirl = Array.from({ length: 45 }, (_, i) => {
      const r = (i / 44) * (R - 25);
      const a = (i / 44) * TAU * 1.5;
      return `${round(C + r * Math.cos(a))} ${round(C + r * Math.sin(a))}`;
    });
    shapes.push({ d: `M ${swirl.join(" L ")}`, stroke: "#b5533c", strokeWidth: 4 });
    for (let i = 0; i < req.bands; i++) {
      const from = (i / req.bands) * TAU;
      const to = ((i + 1) / req.bands) * TAU;
      const point = (a: number) => `${round(MAP + R * Math.cos(a))} ${round(C + R * Math.sin(a))}`;
      shapes.push({ d: `M ${MAP} ${C} L ${point(from)} A ${R} ${R} 0 0 1 ${point(to)} Z`, fill: req.dyes[i % k], ...line });
      labels.push({ x: round(MAP + R * 0.65 * Math.cos((from + to) / 2)), y: round(C + R * 0.65 * Math.sin((from + to) / 2)), text: letterOf(i % k) });
    }
  } else if (req.technique === "bullseye") {
    shapes.push({ d: `M ${C} 30 L ${C - 140} 450 L ${C + 140} 450 Z`, fill: "#ffffff", ...line });
    for (let i = 1; i < req.bands; i++) {
      const y = 30 + (420 * i) / req.bands;
      const half = (140 * i) / req.bands;
      shapes.push({ d: `M ${round(C - half)} ${round(y)} L ${round(C + half)} ${round(y)}`, stroke: "#b5533c", strokeWidth: 5 });
    }
    for (let i = req.bands - 1; i >= 0; i--) {
      shapes.push({ d: circle(MAP, C, round((R * (i + 1)) / req.bands)), fill: req.dyes[i % k], ...line });
      labels.push({ x: round(MAP + (R * (i + 0.5)) / req.bands), y: C, text: letterOf(i % k) });
    }
  } else {
    const folds = accordionFolds(req.bands);
    const zig = Array.from({ length: folds * 2 + 1 }, (_, i) => `${round(40 + (400 * i) / (folds * 2))} ${i % 2 ? 60 : 130}`);
    shapes.push({ d: `M ${zig.join(" L ")}`, ...line });
    shapes.push({ d: `M 110 190 L 370 190 L 370 450 L 110 450 Z`, fill: "#ffffff", ...line });
    shapes.push({ d: `M 170 250 L 310 250 L 310 390 L 170 390 Z`, fill: "#d9c9a8", ...line });
    const left = MAP - R;
    const right = MAP + R;
    const top = C - R;
    const bottom = C + R;
    shapes.push({ d: `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`, fill: req.dyes[0], ...line });
    labels.push({ x: left + 30, y: C, text: letterOf(0) });
    shapes.push({ d: `M ${left + 70} ${top + 70} L ${right - 70} ${top + 70} L ${right - 70} ${bottom - 70} L ${left + 70} ${bottom - 70} Z`, fill: req.fabric, ...line });
    const corners: Point[] = [[right - 45, top + 45], [right - 45, bottom - 45], [left + 45, bottom - 45]];
    req.dyes.slice(1).forEach((dye, i) => {
      const [x, y] = corners[i];
      shapes.push({ d: circle(x, y, 38), fill: dye, ...line });
      labels.push({ x, y, text: letterOf(i + 1) });
    });
  }
  return { shapes, labels };
}

/** A light or dark label, whichever reads on the color under it. */
export function labelInk(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 140 ? "#111111" : "#ffffff";
}

function guideSvg(req: TieDyeRequest, title: string): string {
  const { shapes, labels } = tieDyeGuide(req);
  const body = shapes.map((s) => `<path d="${s.d}" fill="${s.fill ?? "none"}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth}"` : ""}/>`).join("");
  const under = (label: TieDyeGuideLabel) => labelInk(req.dyes[label.text.charCodeAt(0) - 65]);
  const words = labels.map((l) => `<text x="${l.x}" y="${l.y + 10}" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="${under(l)}">${l.text}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GUIDE_WIDTH} ${GUIDE_HEIGHT}" role="img"><title>${title}</title><rect width="${GUIDE_WIDTH}" height="${GUIDE_HEIGHT}" fill="#ffffff"/><g stroke-linejoin="round" stroke-linecap="round">${body}</g>${words}</svg>`;
}

/** How much to mix. Each dye gets an equal share, rounded up to a whole ounce. */
export function tieDyeMix(req: TieDyeRequest): TieDyeMix[] {
  const ounces = Math.ceil((req.garments * OUNCES_PER_SHIRT) / req.dyes.length);
  const cups = ounces / OUNCES_PER_CUP;
  return req.dyes.map((color, i) => ({
    letter: letterOf(i),
    color,
    ounces,
    // A half teaspoon is the smallest measure most kitchens have.
    teaspoons: Math.ceil(cups * req.strength * 2) / 2,
    ureaTablespoons: Math.ceil(cups * UREA_TBSP_PER_CUP * 4) / 4,
  }));
}

export function generateTieDye(req: TieDyeRequest): TieDyeResult {
  const locale = req.locale ?? "en";
  const layers = tieDyeLayers(req);
  const say = (key: Phrase, values: Record<string, string | number> = {}) => tieDyeSay(locale, key, values);
  const letters = req.dyes.map((_, i) => letterOf(i)).join(", ");
  const folds = accordionFolds(req.bands);
  const body = layers.map((l) => `<path style="mix-blend-mode:multiply" fill="${l.fill}" d="${l.d}"/>`).join("");
  const fold: Record<TieDyeTechnique, string[]> = {
    spiral: [say("spiralFold1"), say("spiralFold2"), say("spiralFold3", { ties: Math.ceil(req.bands / 2), wedges: req.bands })],
    bullseye: [say("bullseyeFold1"), say("bullseyeFold2"), say("bullseyeFold3", { rings: req.bands, ties: req.bands - 1 })],
    accordion: [say("accordionFold1", { folds }), say("accordionFold2", { folds }), say("accordionFold3")],
  };
  return {
    svg: {
      art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${SIZE_INCHES}in" height="${SIZE_INCHES}in" role="img" style="isolation:isolate"><title>${say("svgArt")}</title><rect width="${CANVAS}" height="${CANVAS}" fill="${req.fabric}"/>${body}</svg>`,
      guide: guideSvg(req, say("svgGuide")),
    },
    technique: req.technique,
    layers: layers.length,
    mix: tieDyeMix(req),
    steps: {
      fold: fold[req.technique],
      soak: [say("soak1"), say("soak2")],
      apply: [say("apply1", { letters }), say(`apply_${req.technique}`), say("apply2")],
      cure: [say("cure1"), say("cure2"), say("cure3"), say("cure4")],
      safety: [say("safety1"), say("safety2")],
    },
  };
}
