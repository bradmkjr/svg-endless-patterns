import type { Locale } from "./i18n";
import mandalaText from "./messages/mandala.json";

/**
 * Geometric radial designs. The canvas is split into concentric rings, and each ring
 * repeats one motif around the center. Every motif is drawn in its own wedge, so copies
 * can't overlap, and no point goes past the ring's outer edge, so nothing leaves the canvas.
 */

export const MOTIFS = ["petals", "arcs", "dots", "scallops", "diamonds", "triangles", "lotus", "leaves", "teardrops", "stars", "hearts", "chevrons", "rays", "fans", "ogees"] as const;
export type MandalaMotif = (typeof MOTIFS)[number];

/** A ring chosen by hand. Colors are indexes into `colors`, wrapped to fit; a band of `null` shows the background. */
export type MandalaRingSpec = {
  motif: MandalaMotif;
  /** Copies per fold. The innermost ring always has one, which fixes the design's symmetry. */
  repeat: number;
  /** Depth relative to the other rings, as a percentage. */
  size: number;
  color: number;
  band: number | null;
  accent: boolean;
  /** Turn the ring half a copy, so its motifs sit between those of its neighbors. */
  offset: boolean;
};

export type MandalaRequest = {
  /** How many times the design repeats in one turn. */
  symmetry: number;
  rings: number;
  /** Rings from the center out. When set, these are drawn and `rings`, `motifs` and `seed` are ignored. */
  ringPlan?: MandalaRingSpec[];
  /** The motifs the seed may choose from. */
  motifs: MandalaMotif[];
  /** The same seed always gives the same design. */
  seed: number;
  /** Line width, in canvas units (the canvas is 1000 across). */
  lineWeight: number;
  colors: string[];
  background: string;
  outline: string;
  locale?: Locale;
};

/** One ring, numbered from the center. */
export type MandalaRing = { index: number; motif: MandalaMotif; copies: number; color: string; spec: MandalaRingSpec };

export type MandalaResult = {
  svg: { art: string; coloring: string };
  symmetry: number;
  rings: MandalaRing[];
  shapes: number;
};

/** Plain JSON for one drawn shape, shared by the SVG and the PDF. */
type ShapeStyle = { fill: string; stroke: string; strokeWidth: number };
export type MandalaShape = ({ kind: "circle"; cx: number; cy: number; r: number } | { kind: "path"; d: string }) & ShapeStyle;
export type MandalaDrawing = { art: MandalaShape[]; coloring: MandalaShape[]; rings: MandalaRing[] };

type Phrase = keyof typeof mandalaText.en;

export const CANVAS = 1000;
const CENTER = CANVAS / 2;
/** Outer edge of the design. The margin leaves room for the widest line. */
const OUTER = 480;
/** Copies must be at least this wide to double up in a ring, so inner rings stay legible. */
const MIN_DOUBLED_WIDTH = 28;
/** A motif's width may reach this many times the ring's depth before the ring adds copies. */
const WIDEST_MOTIF = 1.6;
const SIZE_INCHES = 8;
const WHITE = "#ffffff";
const BLACK = "#000000";

export function mandalaSay(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  return mandalaText[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
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

const round = (n: number) => Number(n.toFixed(2));

/** A point in a motif's wedge: `f` from 0 to 1 across the ring, `a` from -1 to 1 across the wedge. */
type WedgePoint = (f: number, a: number) => string;

/** Each motif is one or more outlines. A line with no area, such as a leaf's rib, shows only its stroke. */
const OUTLINES: Record<Exclude<MandalaMotif, "dots">, (p: WedgePoint) => string | string[]> = {
  petals: (p) => `M ${p(0, 0)} C ${p(0.35, 0.85)} ${p(0.8, 0.7)} ${p(1, 0)} C ${p(0.8, -0.7)} ${p(0.35, -0.85)} ${p(0, 0)} Z`,
  arcs: (p) => `M ${p(0, -0.9)} C ${p(1, -0.9)} ${p(1, 0.9)} ${p(0, 0.9)} L ${p(0, 0.6)} C ${p(0.6, 0.6)} ${p(0.6, -0.6)} ${p(0, -0.6)} Z`,
  scallops: (p) => `M ${p(0, -1)} C ${p(1, -1)} ${p(1, 1)} ${p(0, 1)} Z`,
  diamonds: (p) => `M ${p(0, 0)} L ${p(0.5, 0.8)} L ${p(1, 0)} L ${p(0.5, -0.8)} Z`,
  triangles: (p) => `M ${p(0, -0.9)} L ${p(1, 0)} L ${p(0, 0.9)} Z`,
  lotus: (p) => [
    `M ${p(0, 0)} C ${p(0.2, 1)} ${p(0.6, 0.95)} ${p(0.72, 0.55)} C ${p(0.6, 0.25)} ${p(0.3, 0.1)} ${p(0, 0)} Z`,
    `M ${p(0, 0)} C ${p(0.2, -1)} ${p(0.6, -0.95)} ${p(0.72, -0.55)} C ${p(0.6, -0.25)} ${p(0.3, -0.1)} ${p(0, 0)} Z`,
    `M ${p(0, 0)} C ${p(0.4, 0.55)} ${p(0.8, 0.4)} ${p(1, 0)} C ${p(0.8, -0.4)} ${p(0.4, -0.55)} ${p(0, 0)} Z`,
  ],
  leaves: (p) => [`M ${p(0, 0)} C ${p(0.2, 0.95)} ${p(0.65, 0.65)} ${p(1, 0)} C ${p(0.65, -0.65)} ${p(0.2, -0.95)} ${p(0, 0)} Z`, `M ${p(0.08, 0)} L ${p(0.85, 0)}`],
  teardrops: (p) => `M ${p(1, 0)} C ${p(0.6, 0.2)} ${p(0.42, 0.75)} ${p(0.2, 0.75)} C ${p(0, 0.75)} ${p(0, -0.75)} ${p(0.2, -0.75)} C ${p(0.42, -0.75)} ${p(0.6, -0.2)} ${p(1, 0)} Z`,
  stars: (p) => `M ${p(0, 0)} L ${p(0.38, 0.22)} L ${p(0.5, 0.9)} L ${p(0.62, 0.22)} L ${p(1, 0)} L ${p(0.62, -0.22)} L ${p(0.5, -0.9)} L ${p(0.38, -0.22)} Z`,
  hearts: (p) => `M ${p(0, 0)} C ${p(0.3, 0.3)} ${p(0.5, 0.95)} ${p(0.8, 0.8)} C ${p(1, 0.65)} ${p(1, 0.15)} ${p(0.74, 0)} C ${p(1, -0.15)} ${p(1, -0.65)} ${p(0.8, -0.8)} C ${p(0.5, -0.95)} ${p(0.3, -0.3)} ${p(0, 0)} Z`,
  chevrons: (p) => `M ${p(0, -0.95)} L ${p(0.55, 0)} L ${p(0, 0.95)} L ${p(0.45, 0.95)} L ${p(1, 0)} L ${p(0.45, -0.95)} Z`,
  rays: (p) => [`M ${p(0, -0.3)} L ${p(1, 0)} L ${p(0, 0.3)} Z`, `M ${p(0, 0.5)} L ${p(0.5, 0.72)} L ${p(0, 0.94)} Z`, `M ${p(0, -0.5)} L ${p(0.5, -0.72)} L ${p(0, -0.94)} Z`],
  fans: (p) => [`M ${p(0, 0)} C ${p(0.5, 1)} ${p(1, 0.8)} ${p(1, 0)} C ${p(1, -0.8)} ${p(0.5, -1)} ${p(0, 0)} Z`, `M ${p(0, 0)} L ${p(0.82, 0.5)}`, `M ${p(0, 0)} L ${p(0.95, 0)}`, `M ${p(0, 0)} L ${p(0.82, -0.5)}`],
  ogees: (p) => `M ${p(0, -0.9)} C ${p(0.3, -0.9)} ${p(0.45, -0.25)} ${p(1, 0)} C ${p(0.45, 0.25)} ${p(0.3, 0.9)} ${p(0, 0.9)} C ${p(0.25, 0.3)} ${p(0.25, -0.3)} ${p(0, -0.9)} Z`,
};

/** Where a small accent dot sits inside each motif. */
const ACCENT_AT: Record<Exclude<MandalaMotif, "dots">, number> = { petals: 0.45, arcs: 0.2, scallops: 0.4, diamonds: 0.5, triangles: 0.3, lotus: 0.5, leaves: 0.4, teardrops: 0.25, stars: 0.5, hearts: 0.45, chevrons: 0.72, rays: 0.25, fans: 0.3, ogees: 0.25 };

type PlannedRing = { index: number; r0: number; r1: number; copies: number; spec: MandalaRingSpec };

/** Lays rings out from the center in proportion to their depths. */
function layOut(specs: MandalaRingSpec[], weights: number[], symmetry: number, hub: number): PlannedRing[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let inner = hub;
  return specs.map((spec, index) => {
    const r0 = inner;
    inner += ((OUTER - hub) * weights[index]) / total;
    // The innermost ring always has exactly one copy per fold, which fixes the design's symmetry at that order.
    return { index, r0, r1: inner, copies: symmetry * (index === 0 ? 1 : spec.repeat), spec };
  });
}

/** The seed's choices for each ring. Palette and line changes never alter the geometry. */
function planRings(req: MandalaRequest, hub: number, colorCount: number): PlannedRing[] {
  const random = seededRandom(req.seed);
  const allowed = req.motifs.length ? req.motifs : [...MOTIFS];
  const weights = Array.from({ length: req.rings }, () => 0.8 + random() * 0.45);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let inner = hub;
  let previous: MandalaMotif | null = null;

  const specs = weights.map((weight, index) => {
    const width = ((OUTER - hub) * weight) / total;
    const r0 = inner;
    inner += width;
    // Use a different motif from the ring inside it, when there's a choice.
    const choices = allowed.length > 1 ? allowed.filter((m) => m !== previous) : allowed;
    const motif = choices[Math.floor(random() * choices.length)];
    previous = motif;
    const wantsDouble = random() < 0.4;
    const wantsAccent = random() < 0.5;
    const motifColor = random();
    const bandColor = random();
    const tintedBand = random() < 0.35;
    // Few folds would stretch outer motifs into slivers, so wide rings repeat more per fold.
    const fit = Math.max(1, Math.floor((2 * Math.PI * (r0 + width / 2)) / (req.symmetry * width * WIDEST_MOTIF)));
    const doubled = wantsDouble && (2 * Math.PI * r0) / (req.symmetry * fit * 2) >= MIN_DOUBLED_WIDTH;
    const color = Math.floor(motifColor * colorCount);
    const band = Math.floor(bandColor * colorCount);
    return {
      motif,
      repeat: index === 0 ? 1 : fit * (doubled ? 2 : 1),
      size: Math.round(weight * 100),
      color,
      // A tinted band must differ from its motif, or the motif would show only as an outline.
      band: tintedBand && band !== color ? band : null,
      accent: wantsAccent,
      offset: false,
    };
  });
  return layOut(specs, weights, req.symmetry, hub);
}

/** Outermost first, so each ring's disc hides any line that dips below the ring outside it. */
export function drawMandala(req: MandalaRequest): MandalaDrawing {
  const palette = req.colors.length ? req.colors : [req.outline];
  const paint = (index: number) => palette[index % palette.length];
  const hub = Math.max(70, req.symmetry * 5);
  const plan = req.ringPlan?.length ? layOut(req.ringPlan, req.ringPlan.map((ring) => ring.size), req.symmetry, hub) : planRings(req, hub, palette.length);
  const style = (fill: string): ShapeStyle => ({ fill, stroke: req.outline, strokeWidth: req.lineWeight });
  const disc = (r: number, fill: string): MandalaShape => ({ kind: "circle", cx: CENTER, cy: CENTER, r: round(r), ...style(fill) });
  const art: MandalaShape[] = [];

  for (const ring of [...plan].reverse()) {
    const { motif, color, band: bandIndex, accent: wantsAccent, offset } = ring.spec;
    const band = bandIndex === null ? req.background : paint(bandIndex);
    const accent = paint(color + 1);
    art.push(disc(ring.r1, band));

    const pad = (ring.r1 - ring.r0) * 0.06;
    const from = ring.r0 + pad;
    const span = ring.r1 - ring.r0 - pad * 2;
    const pitch = (2 * Math.PI) / ring.copies;
    const middle = from + span / 2;
    const wedgeHalf = middle * Math.sin(pitch / 2);

    for (let copy = 0; copy < ring.copies; copy++) {
      const axis = -Math.PI / 2 + (copy + (offset ? 0.5 : 0)) * pitch;
      const at = (f: number, a: number) => {
        const r = from + span * f;
        const angle = axis + (a * pitch) / 2;
        return { x: round(CENTER + r * Math.cos(angle)), y: round(CENTER + r * Math.sin(angle)) };
      };
      const dot = (f: number, r: number, fill: string): MandalaShape => {
        const { x, y } = at(f, 0);
        return { kind: "circle", cx: x, cy: y, r: round(r), ...style(fill) };
      };
      if (motif === "dots") {
        art.push(dot(0.5, Math.min(span / 2, wedgeHalf) * 0.72, paint(color)));
        continue;
      }
      const point: WedgePoint = (f, a) => {
        const { x, y } = at(f, a);
        return `${x} ${y}`;
      };
      for (const d of [OUTLINES[motif](point)].flat()) art.push({ kind: "path", d, ...style(paint(color)) });
      if (wantsAccent) art.push(dot(ACCENT_AT[motif], Math.min(span * 0.07, wedgeHalf * 0.22), accent));
    }
  }
  art.push(disc(hub, palette[0]));

  return {
    art,
    // The same shapes, so outlines match. White fills are the paper: they keep hidden lines hidden.
    coloring: art.map((shape) => ({ ...shape, fill: WHITE, stroke: BLACK })),
    rings: plan.map((ring) => ({ index: ring.index + 1, motif: ring.spec.motif, copies: ring.copies, color: paint(ring.spec.color), spec: ring.spec })),
  };
}

function shapeSvg(shape: MandalaShape): string {
  const paint = `fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"`;
  return shape.kind === "circle" ? `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${paint}/>` : `<path d="${shape.d}" ${paint}/>`;
}

function drawingSvg(shapes: MandalaShape[], page: string, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${SIZE_INCHES}in" height="${SIZE_INCHES}in" role="img"><title>${title}</title><rect width="${CANVAS}" height="${CANVAS}" fill="${page}"/><g stroke-linejoin="round">${shapes.map(shapeSvg).join("")}</g></svg>`;
}

export function generateMandala(req: MandalaRequest): MandalaResult {
  const locale = req.locale ?? "en";
  const drawing = drawMandala(req);
  return {
    svg: {
      art: drawingSvg(drawing.art, req.background, mandalaSay(locale, "svgArt")),
      coloring: drawingSvg(drawing.coloring, WHITE, mandalaSay(locale, "svgColoring")),
    },
    symmetry: req.symmetry,
    rings: drawing.rings,
    shapes: drawing.art.length,
  };
}

/** A small picture of a motif for choosing it, as one copy across its wedge. */
export function mandalaMotifThumb(motif: MandalaMotif): string {
  const point: WedgePoint = (f, a) => `${round(50 + a * 40)} ${round(90 - f * 80)}`;
  const shapes = motif === "dots" ? `<circle cx="50" cy="50" r="28"/>` : [OUTLINES[motif](point)].flat().map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#ffffff" stroke="#1d2b3a" stroke-width="5" stroke-linejoin="round">${shapes}</svg>`;
}
