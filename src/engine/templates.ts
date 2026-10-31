import type { Block } from "./blocks";
import { approxInches } from "./format";
import { say, term, type Locale } from "./i18n";
import { blockPieces, type Point } from "./pieces";

export const SEAM_ALLOWANCE = 0.25;

export type Template = {
  label: string;
  shape: "rect" | "half" | "quarter" | "template";
  /** Finished outline and cutting outline, both in inches with the same origin. */
  finished: Point[];
  cutting: Point[];
  counts: { fabric: string; count: number }[];
  name: string;
};

/** A simple outline pushed out by `distance` on every side, curves included. */
export function offsetOutline(points: Point[], distance: number): Point[] {
  const n = points.length;
  const area = points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % n];
    return sum + x * ny - nx * y;
  }, 0);
  const sign = area > 0 ? 1 : -1;
  const lines = points.map(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % n];
    const len = Math.hypot(nx - x, ny - y);
    const ox = (sign * (ny - y)) / len;
    const oy = (sign * -(nx - x)) / len;
    return { x: x + ox * distance, y: y + oy * distance, dx: nx - x, dy: ny - y };
  });
  return lines.map((line, i) => {
    const prev = lines[(i + n - 1) % n];
    const denom = prev.dx * line.dy - prev.dy * line.dx;
    const t = ((line.x - prev.x) * line.dy - (line.y - prev.y) * line.dx) / denom;
    return [prev.x + prev.dx * t, prev.y + prev.dy * t] as Point;
  });
}

function outline(shape: Exclude<Template["shape"], "template">, a: number, b: number): Point[] {
  if (shape === "rect") return [[0, 0], [a, 0], [a, b], [0, b]];
  if (shape === "half") return [[0, 0], [a, 0], [0, a]];
  return [[0, 0], [a, 0], [a / 2, a / 2]];
}

/** One true-size template per distinct shape, with how many to cut of each fabric. */
export function blockTemplates(block: Block, size: number, blocks = 1, locale: Locale = "en"): Template[] {
  const unit = size / block.grid;
  const groups = new Map<string, { shape: Template["shape"]; a: number; b: number; title?: string; points: Point[]; counts: Map<string, number> }>();
  for (const p of blockPieces(block)) {
    // A named template is one shape, however it's turned in the block.
    const key = p.name ?? `${p.shape}|${p.a.toFixed(6)}|${p.b.toFixed(6)}`;
    const group = groups.get(key) ?? { shape: p.shape, a: p.a * unit, b: p.b * unit, title: p.name, points: p.points, counts: new Map() };
    group.counts.set(p.fabric, (group.counts.get(p.fabric) ?? 0) + blocks);
    groups.set(key, group);
  }
  const sorted = [...groups.values()].sort((x, y) => y.a * y.b - x.a * x.b);
  return sorted.map((g, i) => {
    if (g.shape === "template") {
      const minX = Math.min(...g.points.map(([x]) => x));
      const minY = Math.min(...g.points.map(([, y]) => y));
      const finished = g.points.map(([x, y]): Point => [(x - minX) * unit, (y - minY) * unit]);
      return {
        label: String.fromCharCode(65 + i),
        shape: g.shape,
        finished,
        cutting: offsetOutline(finished, SEAM_ALLOWANCE),
        counts: [...g.counts].map(([fabric, count]) => ({ fabric, count })),
        name: term(locale, "templates", g.title ?? "Template"),
      };
    }
    const finished = outline(g.shape, g.a, g.b);
    const isSquare = g.shape === "rect" && g.a === g.b;
    const name = say(locale, g.shape === "half" ? "tmplHalf" : g.shape === "quarter" ? "tmplQuarter" : isSquare ? "tmplSquare" : "tmplRect");
    const dims = g.shape === "rect" ? (isSquare ? `${approxInches(g.a)}"` : `${approxInches(g.a)}" x ${approxInches(g.b)}"`) : `${approxInches(g.a)}"`;
    return {
      label: String.fromCharCode(65 + i),
      shape: g.shape,
      finished,
      cutting: offsetOutline(finished, SEAM_ALLOWANCE),
      counts: [...g.counts].map(([fabric, count]) => ({ fabric, count })),
      name: say(locale, "tmplFinished", { name, dims }),
    };
  });
}
