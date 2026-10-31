import type { Block } from "./blocks";
import { ceilToEighth, inches, isOnRuler } from "./format";
import { blockPieces } from "./pieces";
import type { PatternRequest } from "./types";

/** Seam allowance on all sides of a square or strip. */
const RECT_ADD = 1 / 2;
/** Added to a triangle's leg: a square cut once diagonally. */
const HALF_ADD = 7 / 8;
/** Added to a triangle's long side: a square cut twice diagonally. */
const QUARTER_ADD = 5 / 4;

export type Cut = {
  fabric: string;
  method: "square" | "rect" | "strip" | "half" | "quarter";
  /** Cut size, on ruler eighths: w is the longer side. */
  w: number;
  h: number;
  /** How many of that cut. */
  qty: number;
  /** Shapes produced: triangles for half and quarter cuts, otherwise `qty`. */
  pieces: number;
  /** The finished size falls between ruler marks, so the cut was rounded up. */
  rounded: boolean;
};

function keyOf(fabric: string, shape: string, a: number, b: number) {
  return `${fabric}|${shape}|${a.toFixed(6)}|${b.toFixed(6)}`;
}

/** Cuts for `count` copies of a block finishing at `size` inches. */
export function blockCuts(block: Block, size: number, count = 1): Cut[] {
  const unit = size / block.grid;
  const tally = new Map<string, { fabric: string; shape: string; a: number; b: number; n: number }>();
  for (const p of blockPieces(block)) {
    const key = keyOf(p.fabric, p.shape, p.a, p.b);
    const entry = tally.get(key) ?? { fabric: p.fabric, shape: p.shape, a: p.a * unit, b: p.b * unit, n: 0 };
    entry.n += count;
    tally.set(key, entry);
  }
  const cuts = [...tally.values()].map(({ fabric, shape, a, b, n }): Cut => {
    if (shape === "half" || shape === "quarter") {
      const add = shape === "half" ? HALF_ADD : QUARTER_ADD;
      const side = ceilToEighth(a + add);
      const perSquare = shape === "half" ? 2 : 4;
      return { fabric, method: shape, w: side, h: side, qty: Math.ceil(n / perSquare), pieces: n, rounded: !isOnRuler(a) };
    }
    const w = ceilToEighth(a + RECT_ADD);
    const h = ceilToEighth(b + RECT_ADD);
    return { fabric, method: w === h ? "square" : "rect", w, h, qty: n, pieces: n, rounded: !isOnRuler(a) || !isOnRuler(b) };
  });
  return cuts.sort((x, y) => y.w * y.h - x.w * x.h);
}

export type QuiltSize = { width: number; height: number; blocks: number };

export function quiltSize(state: PatternRequest): QuiltSize {
  const { size, cols, rows, sashing, border } = state;
  return {
    width: cols * size + (cols - 1) * sashing + 2 * border,
    height: rows * size + (rows - 1) * sashing + 2 * border,
    blocks: cols * rows,
  };
}

/** Sashing and border cuts for the quilt top. */
export function layoutCuts(state: PatternRequest): Cut[] {
  const { size, cols, rows, sashing, border } = state;
  const cuts: Cut[] = [];
  if (sashing > 0) {
    const strips = (cols - 1) * rows + (rows - 1) * cols;
    const stones = (cols - 1) * (rows - 1);
    if (strips > 0) {
      const w = Math.max(size, sashing) + RECT_ADD;
      const h = Math.min(size, sashing) + RECT_ADD;
      cuts.push({ fabric: "sashing", method: w === h ? "square" : "rect", w, h, qty: strips, pieces: strips, rounded: false });
    }
    if (stones > 0) {
      const side = sashing + RECT_ADD;
      cuts.push({ fabric: "sashing", method: "square", w: side, h: side, qty: stones, pieces: stones, rounded: false });
    }
  }
  if (border > 0) {
    const { width, height } = quiltSize(state);
    const h = border + RECT_ADD;
    // Sides first at the inner height, then top and bottom across the full width.
    cuts.push({ fabric: "border", method: "strip", w: height - 2 * border + RECT_ADD, h, qty: 2, pieces: 2, rounded: false });
    cuts.push({ fabric: "border", method: "strip", w: width + RECT_ADD, h, qty: 2, pieces: 2, rounded: false });
  }
  return cuts;
}

/** Inches of fabric length one cut needs, taking the cheaper of the two strip directions. */
function cutLength(cut: Cut, wof: number): number {
  const across = (strip: number, length: number) => {
    const perStrip = Math.floor(wof / length);
    if (perStrip < 1) return Math.ceil((cut.qty * length) / wof) * strip; // joined strips
    return Math.ceil(cut.qty / perStrip) * strip;
  };
  return Math.min(across(cut.h, cut.w), across(cut.w, cut.h));
}

/** A cushion for straightening, shrinkage and a mis-cut. */
export const YARDAGE_ALLOWANCE = 0.1;

function toYards(length: number, allowance = YARDAGE_ALLOWANCE): number {
  return ceilToEighth((length * (1 + allowance)) / 36);
}

export type Yardage = { fabric: string; yards: number };

export type QuiltPlan = {
  size: QuiltSize;
  cuts: Cut[];
  yardage: Yardage[];
  backing: { yards: number; panels: number; width: number; height: number };
  binding: { strips: number; yards: number; length: number };
};

export const BACKING_OVERHANG = 4;
export const BINDING_STRIP = 2.5;

/** Everything needed to buy and cut for the whole quilt. */
export function planQuilt(block: Block, state: PatternRequest): QuiltPlan {
  const size = quiltSize(state);
  const cuts = [...blockCuts(block, state.size, size.blocks), ...layoutCuts(state)];

  const totals = new Map<string, number>();
  for (const cut of cuts) totals.set(cut.fabric, (totals.get(cut.fabric) ?? 0) + cutLength(cut, state.wof));
  const yardage = [...totals].map(([fabric, length]) => ({ fabric, yards: toYards(length) }));

  const backWidth = size.width + 2 * BACKING_OVERHANG;
  const backHeight = size.height + 2 * BACKING_OVERHANG;
  const lengthwise = Math.ceil(backWidth / state.wof);
  const crosswise = Math.ceil(backHeight / state.wof);
  const useLengthwise = lengthwise * backHeight <= crosswise * backWidth;
  const backing = {
    panels: useLengthwise ? lengthwise : crosswise,
    width: backWidth,
    height: backHeight,
    yards: toYards(useLengthwise ? lengthwise * backHeight : crosswise * backWidth),
  };

  const bindingLength = 2 * (size.width + size.height) + 20;
  const strips = Math.ceil(bindingLength / state.wof);
  const binding = { strips, length: bindingLength, yards: toYards(strips * BINDING_STRIP) };

  return { size, cuts, yardage, backing, binding };
}

/** The nearest block sizes, one smaller and one larger, whose units land on ruler eighths. */
export function rulerFriendlySizes(block: Block, size: number): number[] {
  const works = (s: number) =>
    // A square on point is irrational at every size, so it can't count against one.
    blockPieces(block).every((p) => p.onPoint || (isOnRuler((p.a * s) / block.grid) && isOnRuler((p.b * s) / block.grid)));
  const found: number[] = [];
  for (let s = size - 0.5; s >= 3; s -= 0.5) {
    if (works(s)) {
      found.push(s);
      break;
    }
  }
  for (let s = size + 0.5; s <= 24; s += 0.5) {
    if (works(s)) {
      found.push(s);
      break;
    }
  }
  return found;
}

export function describeCut(cut: Cut): string {
  const dims = cut.w === cut.h ? `${inches(cut.w)}" square` : `${inches(cut.w)}" x ${inches(cut.h)}"`;
  switch (cut.method) {
    case "half":
      return `${cut.qty} x ${dims}, cut once diagonally (${cut.pieces} triangles)`;
    case "quarter":
      return `${cut.qty} x ${dims}, cut twice diagonally (${cut.pieces} triangles)`;
    case "strip":
      return `${cut.qty} x ${dims} strip${cut.qty === 1 ? "" : "s"}, joined if needed`;
    default:
      return `${cut.qty} x ${dims}`;
  }
}
