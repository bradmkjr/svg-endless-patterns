import type { Locale } from "./i18n";
import mandalaText from "./messages/mandala.json";

/**
 * Geometric radial designs. The canvas is split into concentric rings, and each ring
 * repeats one motif around the center. Every motif is drawn in its own wedge, so copies
 * can't overlap, and no point goes past the ring's outer edge, so nothing leaves the canvas.
 */

export const MOTIFS = ["petals", "arcs", "dots", "scallops", "diamonds", "triangles"] as const;
export type MandalaMotif = (typeof MOTIFS)[number];

export type MandalaRequest = {
  /** How many times the design repeats in one turn. */
  symmetry: number;
  rings: number;
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
export type MandalaRing = { index: number; motif: MandalaMotif; copies: number; color: string };

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

const OUTLINES: Record<Exclude<MandalaMotif, "dots">, (p: WedgePoint) => string> = {
  petals: (p) => `M ${p(0, 0)} C ${p(0.35, 0.85)} ${p(0.8, 0.7)} ${p(1, 0)} C ${p(0.8, -0.7)} ${p(0.35, -0.85)} ${p(0, 0)} Z`,
  arcs: (p) => `M ${p(0, -0.9)} C ${p(1, -0.9)} ${p(1, 0.9)} ${p(0, 0.9)} L ${p(0, 0.6)} C ${p(0.6, 0.6)} ${p(0.6, -0.6)} ${p(0, -0.6)} Z`,
  scallops: (p) => `M ${p(0, -1)} C ${p(1, -1)} ${p(1, 1)} ${p(0, 1)} Z`,
  diamonds: (p) => `M ${p(0, 0)} L ${p(0.5, 0.8)} L ${p(1, 0)} L ${p(0.5, -0.8)} Z`,
  triangles: (p) => `M ${p(0, -0.9)} L ${p(1, 0)} L ${p(0, 0.9)} Z`,
};

/** Where a small accent dot sits inside each motif. */
const ACCENT_AT: Record<Exclude<MandalaMotif, "dots">, number> = { petals: 0.45, arcs: 0.2, scallops: 0.4, diamonds: 0.5, triangles: 0.3 };

/** The seed's choices for each ring. Palette and line changes never alter the geometry. */
function planRings(req: MandalaRequest, hub: number) {
  const random = seededRandom(req.seed);
  const allowed = req.motifs.length ? req.motifs : [...MOTIFS];
  const weights = Array.from({ length: req.rings }, () => 0.8 + random() * 0.45);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let inner = hub;
  let previous: MandalaMotif | null = null;

  return weights.map((weight, index) => {
    const width = ((OUTER - hub) * weight) / total;
    const r0 = inner;
    const r1 = inner + width;
    inner = r1;
    // Use a different motif from the ring inside it, when there's a choice.
    const choices = allowed.length > 1 ? allowed.filter((m) => m !== previous) : allowed;
    const motif = choices[Math.floor(random() * choices.length)];
    previous = motif;
    const wantsDouble = random() < 0.4;
    const wantsAccent = random() < 0.5;
    const motifColor = random();
    const bandColor = random();
    const tintedBand = random() < 0.35;
    // The innermost ring always has exactly one copy per fold, which fixes the design's symmetry at that order.
    const doubled = index > 0 && wantsDouble && (2 * Math.PI * r0) / (req.symmetry * 2) >= MIN_DOUBLED_WIDTH;
    return { index, r0, r1, motif, copies: req.symmetry * (doubled ? 2 : 1), wantsAccent, motifColor, bandColor, tintedBand };
  });
}

/** Outermost first, so each ring's disc hides any line that dips below the ring outside it. */
export function drawMandala(req: MandalaRequest): MandalaDrawing {
  const palette = req.colors.length ? req.colors : [req.outline];
  const pickColor = (fraction: number) => Math.floor(fraction * palette.length);
  const hub = Math.max(70, req.symmetry * 5);
  const plan = planRings(req, hub);
  const style = (fill: string): ShapeStyle => ({ fill, stroke: req.outline, strokeWidth: req.lineWeight });
  const disc = (r: number, fill: string): MandalaShape => ({ kind: "circle", cx: CENTER, cy: CENTER, r: round(r), ...style(fill) });
  const art: MandalaShape[] = [];

  for (const ring of [...plan].reverse()) {
    const motifIndex = pickColor(ring.motifColor);
    const bandIndex = pickColor(ring.bandColor);
    // A tinted band must differ from its motif, or the motif would show only as an outline.
    const band = ring.tintedBand && bandIndex !== motifIndex ? palette[bandIndex] : req.background;
    const accent = palette[(motifIndex + 1) % palette.length];
    art.push(disc(ring.r1, band));

    const pad = (ring.r1 - ring.r0) * 0.06;
    const from = ring.r0 + pad;
    const span = ring.r1 - ring.r0 - pad * 2;
    const pitch = (2 * Math.PI) / ring.copies;
    const middle = from + span / 2;
    const wedgeHalf = middle * Math.sin(pitch / 2);

    for (let copy = 0; copy < ring.copies; copy++) {
      const axis = -Math.PI / 2 + copy * pitch;
      const at = (f: number, a: number) => {
        const r = from + span * f;
        const angle = axis + (a * pitch) / 2;
        return { x: round(CENTER + r * Math.cos(angle)), y: round(CENTER + r * Math.sin(angle)) };
      };
      const dot = (f: number, r: number, fill: string): MandalaShape => {
        const { x, y } = at(f, 0);
        return { kind: "circle", cx: x, cy: y, r: round(r), ...style(fill) };
      };
      if (ring.motif === "dots") {
        art.push(dot(0.5, Math.min(span / 2, wedgeHalf) * 0.72, palette[motifIndex]));
        continue;
      }
      const point: WedgePoint = (f, a) => {
        const { x, y } = at(f, a);
        return `${x} ${y}`;
      };
      art.push({ kind: "path", d: OUTLINES[ring.motif](point), ...style(palette[motifIndex]) });
      if (ring.wantsAccent) art.push(dot(ACCENT_AT[ring.motif], Math.min(span * 0.07, wedgeHalf * 0.22), accent));
    }
  }
  art.push(disc(hub, palette[0]));

  return {
    art,
    // The same shapes, so outlines match. White fills are the paper: they keep hidden lines hidden.
    coloring: art.map((shape) => ({ ...shape, fill: WHITE, stroke: BLACK })),
    rings: plan.map((ring) => ({ index: ring.index + 1, motif: ring.motif, copies: ring.copies, color: palette[pickColor(ring.motifColor)] })),
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
