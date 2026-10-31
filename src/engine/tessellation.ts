import { approxInches, inches } from "./format";
import type { Locale } from "./i18n";
import text from "./messages/tessellation.json";
import {
  applyAffine,
  compose,
  copiesPerCell,
  GROUP_IDS,
  symmetryElements,
  tileSymmetries,
  wallpaperGroup,
  type Affine,
  type GroupId,
  type LatticeFamily,
  type Vec,
  type WallpaperGroup,
} from "./wallpaper";

export const MOTIF_IDS = ["leaf", "fish", "bird", "paisley", "flag", "sailboat"] as const;
export type TessellationMotif = (typeof MOTIF_IDS)[number];

export type TessellationColors = { background: string; primary: string; accent: string };

export type TessellationRequest = {
  motif: TessellationMotif;
  group: GroupId;
  colors: TessellationColors;
  /** Width of one repeat, in inches. Its height follows from the group's lattice. */
  repeatWidth: number;
  /** Repeats in the tile layout. */
  across: number;
  down: number;
  /** Draw the outline of every tile, that is, every copy of the fundamental domain. */
  outlines: boolean;
  locale?: Locale;
};

export type TessellationResult = {
  svg: { repeat: string; layout: string };
  group: { id: GroupId; family: string; description: string; rotationOrders: number[]; hasMirrors: boolean; hasGlides: boolean };
  motif: string;
  /** Copies of the motif in one repeat. */
  copies: number;
  width: string;
  height: string;
  layoutWidth: string;
  layoutHeight: string;
  symmetry: string[];
  steps: string[];
};

export type TessellationOptions = {
  groups: { id: GroupId; family: string; description: string }[];
  motifs: { id: TessellationMotif; name: string }[];
};

type Phrase = keyof typeof text.en.phrases;

function say(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  return text[locale].phrases[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export const tessellationSay = say;

/** A closed curve through control points (Catmull-Rom), as a polygon fine enough to look smooth. */
function smooth(controls: Vec[], steps = 4): Vec[] {
  const n = controls.length;
  const points: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [controls[(i + n - 1) % n], controls[i], controls[(i + 1) % n], controls[(i + 2) % n]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const blend = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
      points.push([blend(p0[0], p1[0], p2[0], p3[0]), blend(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return points;
}

/** Eight points around a small circle. */
const dot = (x: number, y: number, r: number): Vec[] =>
  Array.from({ length: 8 }, (_, i): Vec => [x + r * Math.cos((i * Math.PI) / 4), y + r * Math.sin((i * Math.PI) / 4)]);

export type MotifShape = { role: "primary" | "accent"; points: Vec[] };

/**
 * Drawn for this site, in a box of about -1 to 1. Each has no mirror or rotation of its
 * own, so the symmetry of a finished pattern is the group's and nothing more; a test checks it.
 */
export const MOTIFS: Record<TessellationMotif, MotifShape[]> = {
  leaf: [
    { role: "primary", points: smooth([[-0.85, 0.8], [-0.6, 0.1], [-0.1, -0.45], [0.6, -0.9], [0.78, -0.25], [0.42, 0.35], [-0.15, 0.68]]) },
    { role: "accent", points: [[-0.78, 0.72], [-0.2, 0.12], [0.5, -0.68], [0.54, -0.62], [-0.08, 0.2], [0.3, 0.2], [0.3, 0.25], [-0.14, 0.27], [-0.7, 0.76]] },
  ],
  fish: [
    { role: "primary", points: [[-0.48, 0.03], [-0.95, -0.42], [-0.82, 0.07], [-0.98, 0.48]] },
    { role: "primary", points: smooth([[-0.58, 0.05], [-0.2, -0.38], [0.3, -0.42], [0.72, -0.12], [0.88, 0.02], [0.55, 0.22], [0.1, 0.32], [-0.3, 0.22]]) },
    { role: "accent", points: [[-0.12, -0.34], [0.14, -0.72], [0.34, -0.36]] },
    { role: "accent", points: [[-0.05, 0.3], [-0.12, 0.6], [0.2, 0.28]] },
    { role: "accent", points: dot(0.56, -0.08, 0.075) },
  ],
  bird: [
    { role: "primary", points: smooth([[-0.9, 0.42], [-0.45, 0.02], [-0.02, -0.08], [0.3, -0.45], [0.62, -0.5], [0.72, -0.25], [0.5, 0.12], [0.1, 0.5], [-0.35, 0.55]]) },
    { role: "primary", points: [[0.66, -0.47], [0.98, -0.36], [0.7, -0.26]] },
    { role: "primary", points: [[-0.02, 0.5], [0.02, 0.92], [0.12, 0.92], [0.12, 0.45]] },
    { role: "accent", points: smooth([[-0.62, 0.28], [-0.2, 0.06], [0.2, 0.0], [0.22, -0.7], [-0.25, -0.75], [-0.3, -0.25]]) },
    { role: "accent", points: dot(0.55, -0.34, 0.06) },
  ],
  paisley: [
    { role: "primary", points: smooth([[-0.68, 0.55], [-0.72, 0.0], [-0.35, -0.5], [0.2, -0.75], [0.9, -0.9], [0.56, -0.35], [0.45, 0.2], [0.05, 0.7], [-0.4, 0.8]]) },
    { role: "accent", points: smooth([[-0.42, 0.42], [-0.42, 0.05], [-0.12, -0.28], [0.3, -0.45], [0.2, -0.08], [0.1, 0.25], [-0.15, 0.5]]) },
    { role: "primary", points: dot(-0.14, 0.14, 0.13) },
    { role: "accent", points: dot(0.5, -0.62, 0.05) },
  ],
  flag: [
    { role: "primary", points: [[-0.5, -0.95], [0.6, -0.95], [0.6, -0.55], [-0.1, -0.55], [-0.1, -0.2], [0.34, -0.2], [0.34, 0.14], [-0.1, 0.14], [-0.1, 0.95], [-0.5, 0.95]] },
    { role: "accent", points: [[0.12, -0.84], [0.48, -0.84], [0.48, -0.66], [0.12, -0.66]] },
    { role: "accent", points: dot(-0.3, 0.68, 0.11) },
  ],
  sailboat: [
    { role: "primary", points: [[-0.92, 0.42], [0.92, 0.42], [0.5, 0.86], [-0.6, 0.86]] },
    { role: "primary", points: [[-0.06, -0.95], [0.66, 0.28], [-0.06, 0.28]] },
    { role: "accent", points: [[-0.2, -0.62], [-0.2, 0.28], [-0.76, 0.28]] },
    { role: "accent", points: dot(0.55, 0.62, 0.07) },
  ],
};

type HalfPlane = { nx: number; ny: number; d: number };

/** The convex polygon as "n . x <= d" constraints, with n pointing outward. */
function halfPlanes(polygon: readonly Vec[]): HalfPlane[] {
  const cx = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const cy = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
  return polygon.map(([x0, y0], i) => {
    const [x1, y1] = polygon[(i + 1) % polygon.length];
    const length = Math.hypot(x1 - x0, y1 - y0);
    let nx = (y1 - y0) / length;
    let ny = (x0 - x1) / length;
    if (nx * (cx - x0) + ny * (cy - y0) > 0) {
      nx = -nx;
      ny = -ny;
    }
    return { nx, ny, d: nx * x0 + ny * y0 };
  });
}

/** Share of the largest fit a motif uses, leaving space between neighboring copies. */
const FIT_MARGIN = 0.9;
const fitCache = new Map<string, Affine>();

/**
 * Places a motif inside a group's domain, as large as it will go. Copies of the domain
 * never overlap, so neither do copies of the motif, and there's no drawing order to get
 * wrong at a seam. Prefers less rotation, so motifs stay upright when that costs little.
 */
export function fitMotif(group: WallpaperGroup, motif: TessellationMotif): Affine {
  const cacheKey = `${group.id}:${motif}`;
  const cached = fitCache.get(cacheKey);
  if (cached) return cached;

  const points = MOTIFS[motif].flatMap((shape) => shape.points);
  const planes = halfPlanes(group.domain);
  const xs = group.domain.map(([x]) => x);
  const ys = group.domain.map(([, y]) => y);
  const angles = [0, ...Array.from({ length: 12 }, (_, i) => [((i + 1) * Math.PI) / 12, (-(i + 1) * Math.PI) / 12]).flat()];

  const scaleAt = (cx: number, cy: number, cos: number, sin: number) => {
    let scale = Infinity;
    for (const { nx, ny, d } of planes) {
      const room = d - nx * cx - ny * cy;
      if (room <= 0) return 0;
      for (const [x, y] of points) {
        const reach = nx * (cos * x - sin * y) + ny * (sin * x + cos * y);
        if (reach > 0 && room / reach < scale) scale = room / reach;
      }
    }
    return scale;
  };

  let best = { scale: 0, cx: 0, cy: 0, angle: 0 };
  const search = (minX: number, maxX: number, minY: number, maxY: number, candidates: number[], gain: number) => {
    for (const angle of candidates) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
          const cx = minX + ((maxX - minX) * i) / 12;
          const cy = minY + ((maxY - minY) * j) / 12;
          const scale = scaleAt(cx, cy, cos, sin);
          if (scale > best.scale * gain) best = { scale, cx, cy, angle };
        }
      }
    }
  };
  search(Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), angles, 1.03);
  // Refine around the best spot at its chosen angle.
  let span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 12;
  for (let round = 0; round < 3; round++) {
    const { cx, cy, angle } = best;
    search(cx - span, cx + span, cy - span, cy + span, [angle], 1);
    span /= 4;
  }

  const scale = best.scale * FIT_MARGIN;
  const cos = Math.cos(best.angle) * scale;
  const sin = Math.sin(best.angle) * scale;
  const fit: Affine = [cos, sin, -sin, cos, best.cx, best.cy];
  fitCache.set(cacheKey, fit);
  return fit;
}

export type Placement = {
  /** Motif coordinates to the plane. */
  transform: Affine;
  /** The copy of the domain that holds this motif. */
  domain: Vec[];
};

/** Room around the repeat for outlines straddling its edges. */
const OUTLINE_MARGIN = 0.02;

/** Every copy of the motif to draw for one repeat, including those that wrap across an edge. */
export function tessellationPlacements(groupId: GroupId, motif: TessellationMotif): Placement[] {
  const group = wallpaperGroup(groupId);
  const fit = fitMotif(group, motif);
  return tileSymmetries(group, group.domain, OUTLINE_MARGIN).map((op) => ({
    transform: compose(op, fit),
    domain: group.domain.map((p) => applyAffine(op, p)),
  }));
}

/** SVG units per unit of the group's lattice. */
export const SVG_UNITS = 100;

const round3 = (value: number) => Number(value.toFixed(3));
const round5 = (value: number) => Number(value.toFixed(5));
const pathOf = (points: readonly Vec[], digits = 3) => `M${points.map(([x, y]) => `${Number(x.toFixed(digits))} ${Number(y.toFixed(digits))}`).join("L")}Z`;

/** Black or white, whichever stands out on this color. */
export function contrastInk(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const luminance = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return luminance > 128 ? "#000000" : "#ffffff";
}

function tileMarkup(req: TessellationRequest, placements: Placement[]): string {
  const paths = MOTIFS[req.motif].map((shape) => `<path d="${pathOf(shape.points)}" fill="${shape.role === "primary" ? req.colors.primary : req.colors.accent}"/>`).join("");
  const copies = placements.map(({ transform: m }) => {
    const matrix = [m[0], m[1], m[2], m[3]].map((v) => round5(v * SVG_UNITS)).concat([round3(m[4] * SVG_UNITS), round3(m[5] * SVG_UNITS)]);
    return `<g transform="matrix(${matrix.join(" ")})">${paths}</g>`;
  });
  const outlines = !req.outlines
    ? ""
    : `<path d="${placements.map(({ domain }) => pathOf(domain.map(([x, y]): Vec => [x * SVG_UNITS, y * SVG_UNITS]), 2)).join("")}" fill="none" stroke="${req.colors.accent}" stroke-opacity="0.6" stroke-width="1"/>`;
  return copies.join("") + outlines;
}

function repeatSvg(req: TessellationRequest, group: WallpaperGroup, placements: Placement[], title: string): string {
  const w = round3(group.cell.width * SVG_UNITS);
  const h = round3(group.cell.height * SVG_UNITS);
  const widthIn = round3(req.repeatWidth);
  const heightIn = round3((req.repeatWidth * group.cell.height) / group.cell.width);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${widthIn}in" height="${heightIn}in" role="img"><title>${title}</title><rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="${req.colors.background}"/>${tileMarkup(req, placements)}</svg>`;
}

/** Several repeats side by side, with the repeat rectangle dashed and one tile outlined. */
function layoutSvg(req: TessellationRequest, group: WallpaperGroup, placements: Placement[], title: string): string {
  const cw = group.cell.width * SVG_UNITS;
  const ch = group.cell.height * SVG_UNITS;
  const w = round3(cw * req.across);
  const h = round3(ch * req.down);
  const widthIn = round3(req.repeatWidth * req.across);
  const heightIn = round3(((req.repeatWidth * group.cell.height) / group.cell.width) * req.down);
  const ink = contrastInk(req.colors.background);
  // Same id means same content: it's built from everything that goes into the tile.
  const id = `tess-${req.group}-${req.motif}-${req.colors.primary.slice(1)}-${req.colors.accent.slice(1)}${req.outlines ? "-o" : ""}`;
  const uses: string[] = [];
  for (let y = 0; y < req.down; y++) for (let x = 0; x < req.across; x++) uses.push(`<use href="#${id}" x="${round3(x * cw)}" y="${round3(y * ch)}"/>`);
  const grid: string[] = [];
  for (let x = 0; x <= req.across; x++) grid.push(`M${round3(x * cw)} 0V${h}`);
  for (let y = 0; y <= req.down; y++) grid.push(`M0 ${round3(y * ch)}H${w}`);
  const tile = pathOf(group.domain.map(([x, y]): Vec => [x * SVG_UNITS, y * SVG_UNITS]), 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${widthIn}in" height="${heightIn}in" role="img"><title>${title}</title><defs><g id="${id}">${tileMarkup(req, placements)}</g></defs><rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="${req.colors.background}"/>${uses.join("")}<path d="${grid.join("")}" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="5 4"/><path d="${tile}" fill="none" stroke="${ink}" stroke-width="2"/></svg>`;
}

export function generateTessellation(req: TessellationRequest): TessellationResult {
  const locale = req.locale ?? "en";
  const group = wallpaperGroup(req.group);
  if (!MOTIFS[req.motif]) throw new Error(`Unknown motif: ${req.motif}`);
  const placements = tessellationPlacements(req.group, req.motif);
  const elements = symmetryElements(group);
  const catalog = text[locale];
  const description = catalog.groups[req.group];
  const heightIn = (req.repeatWidth * group.cell.height) / group.cell.width;
  const title = say(locale, "svgTitle", { group: req.group });
  const copies = copiesPerCell(group);
  const width = inches(req.repeatWidth);
  const height = approxInches(heightIn);

  return {
    svg: {
      repeat: repeatSvg(req, group, placements, title),
      layout: layoutSvg(req, group, placements, title),
    },
    group: {
      id: req.group,
      family: familyName(locale, group.family),
      description,
      rotationOrders: elements.rotationOrders,
      hasMirrors: elements.mirrors.length > 0,
      hasGlides: elements.glides.length > 0,
    },
    motif: catalog.motifs[req.motif],
    copies,
    width,
    height,
    layoutWidth: inches(req.repeatWidth * req.across),
    layoutHeight: approxInches(heightIn * req.down),
    symmetry: [
      say(locale, "symLattice", { family: familyName(locale, group.family) }),
      elements.rotationOrders.length ? say(locale, "symRotations", { orders: elements.rotationOrders.join(", ") }) : say(locale, "symNoRotations"),
      say(locale, elements.mirrors.length ? "symMirrors" : "symNoMirrors"),
      say(locale, elements.glides.length ? "symGlides" : "symNoGlides"),
    ],
    steps: [
      say(locale, "stepCopies", { w: width, h: height, copies }),
      ...(group.family === "hexagonal" ? [say(locale, "stepHex")] : []),
      say(locale, "stepButt"),
      say(locale, "stepPrint"),
    ],
  };
}

function familyName(locale: Locale, family: LatticeFamily): string {
  return text[locale].families[family];
}

/** The choices a builder offers, in the reader's language. */
export function listTessellationOptions(locale: Locale = "en"): TessellationOptions {
  return {
    groups: GROUP_IDS.map((id) => ({ id, family: familyName(locale, wallpaperGroup(id).family), description: text[locale].groups[id] })),
    motifs: MOTIF_IDS.map((id) => ({ id, name: text[locale].motifs[id] })),
  };
}
