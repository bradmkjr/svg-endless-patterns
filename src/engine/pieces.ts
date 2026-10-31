import type { Block, Unit } from "./blocks";

export type Point = [number, number];

/**
 * One cut shape in a block. Sizes are the finished dimension in grid units:
 * `rect` a by b, `half` a triangle with legs of a (half of a square), `quarter`
 * a triangle with a long side of a (a quarter of a square).
 */
export type Piece = {
  fabric: string;
  shape: "rect" | "half" | "quarter" | "template";
  a: number;
  b: number;
  points: Point[];
  /** A square set on point: irrational at every block size. */
  onPoint?: boolean;
  /** Template pieces: what the template is called, and the width and height it spans. */
  name?: string;
  /** Sits on top of another piece, rather than being part of the pieced surface. */
  applique?: boolean;
};

const half = (fabric: string, a: number, points: Point[]): Piece => ({ fabric, shape: "half", a, b: a, points });
const quarter = (fabric: string, a: number, points: Point[]): Piece => ({ fabric, shape: "quarter", a, b: a, points });

function unitPieces(u: Unit): Piece[] {
  switch (u.kind) {
    case "rect":
      return [
        {
          fabric: u.fabric,
          shape: "rect",
          a: Math.max(u.w, u.h),
          b: Math.min(u.w, u.h),
          points: [[u.x, u.y], [u.x + u.w, u.y], [u.x + u.w, u.y + u.h], [u.x, u.y + u.h]],
        },
      ];
    case "hst": {
      const nw: Point = [u.x, u.y];
      const ne: Point = [u.x + u.size, u.y];
      const se: Point = [u.x + u.size, u.y + u.size];
      const sw: Point = [u.x, u.y + u.size];
      const split: Record<typeof u.corner, [Point[], Point[]]> = {
        nw: [[nw, ne, sw], [ne, se, sw]],
        ne: [[nw, ne, se], [nw, se, sw]],
        se: [[ne, se, sw], [nw, ne, sw]],
        sw: [[nw, se, sw], [nw, ne, se]],
      };
      const [a, b] = split[u.corner];
      return [half(u.a, u.size, a), half(u.b, u.size, b)];
    }
    case "qst": {
      const nw: Point = [u.x, u.y];
      const ne: Point = [u.x + u.size, u.y];
      const se: Point = [u.x + u.size, u.y + u.size];
      const sw: Point = [u.x, u.y + u.size];
      const c: Point = [u.x + u.size / 2, u.y + u.size / 2];
      return [
        quarter(u.n, u.size, [nw, ne, c]),
        quarter(u.e, u.size, [ne, se, c]),
        quarter(u.s, u.size, [se, sw, c]),
        quarter(u.w, u.size, [sw, nw, c]),
      ];
    }
    case "goose": {
      const { x, y, w, h } = u;
      const nw: Point = [x, y];
      const ne: Point = [x + w, y];
      const se: Point = [x + w, y + h];
      const sw: Point = [x, y + h];
      const n: Point = [x + w / 2, y];
      const s: Point = [x + w / 2, y + h];
      const e: Point = [x + w, y + h / 2];
      const m: Point = [x, y + h / 2];
      const long = Math.max(w, h);
      const short = Math.min(w, h);
      const layout = {
        up: [[sw, se, n], [nw, n, sw], [n, ne, se]],
        down: [[nw, ne, s], [nw, s, sw], [ne, se, s]],
        left: [[ne, se, m], [nw, ne, m], [m, se, sw]],
        right: [[nw, sw, e], [nw, ne, e], [e, se, sw]],
      } as Record<typeof u.point, Point[][]>;
      const [big, skyA, skyB] = layout[u.point];
      return [quarter(u.goose, long, big), half(u.sky, short, skyA), half(u.sky, short, skyB)];
    }
    case "sis": {
      const nw: Point = [u.x, u.y];
      const ne: Point = [u.x + u.size, u.y];
      const se: Point = [u.x + u.size, u.y + u.size];
      const sw: Point = [u.x, u.y + u.size];
      const n: Point = [u.x + u.size / 2, u.y];
      const e: Point = [u.x + u.size, u.y + u.size / 2];
      const s: Point = [u.x + u.size / 2, u.y + u.size];
      const w: Point = [u.x, u.y + u.size / 2];
      const side = u.size / Math.SQRT2;
      return [
        { fabric: u.center, shape: "rect", a: side, b: side, points: [n, e, s, w], onPoint: true },
        half(u.corners, u.size / 2, [nw, n, w]),
        half(u.corners, u.size / 2, [n, ne, e]),
        half(u.corners, u.size / 2, [e, se, s]),
        half(u.corners, u.size / 2, [s, sw, w]),
      ];
    }
    case "flip": {
      const half = u.size / 2;
      const nw: Point = [u.x, u.y];
      const ne: Point = [u.x + u.size, u.y];
      const se: Point = [u.x + u.size, u.y + u.size];
      const sw: Point = [u.x, u.y + u.size];
      const walk = { nw: [nw, ne, se, sw], ne: [ne, se, sw, nw], se: [se, sw, nw, ne], sw: [sw, nw, ne, se] }[u.corner];
      const [c, next, opposite, prev] = walk;
      const towards = ([x, y]: Point, [tx, ty]: Point): Point => [x + ((tx - x) * half) / u.size, y + ((ty - y) * half) / u.size];
      const a = towards(c, next);
      const b = towards(c, prev);
      return [
        // Both are cut as squares; the drawn shape is what shows after folding.
        { fabric: u.base, shape: "rect", a: u.size, b: u.size, points: [a, next, opposite, prev, b] },
        { fabric: u.tip, shape: "rect", a: half, b: half, points: [c, a, b] },
      ];
    }
    case "shape": {
      const xs = u.points.map(([x]) => x);
      const ys = u.points.map(([, y]) => y);
      return [
        {
          fabric: u.fabric,
          shape: "template",
          a: Math.max(...xs) - Math.min(...xs),
          b: Math.max(...ys) - Math.min(...ys),
          points: u.points,
          name: u.name,
          applique: u.applique,
        },
      ];
    }
  }
}

/** Every cut shape in the block, in grid units. */
export function blockPieces(block: Block): Piece[] {
  return block.units.flatMap(unitPieces);
}

/** Whether a block's construction uses a unit kind. */
export function unitCount(block: Block, kind: Unit["kind"]): number {
  return block.units.filter((u) => u.kind === kind).length;
}
