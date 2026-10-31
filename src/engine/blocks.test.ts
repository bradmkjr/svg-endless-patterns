import { describe, expect, it } from "vitest";
import { BLOCKS, getBlock } from "./blocks";
import { blockPieces, type Point } from "./pieces";

function area(points: Point[]) {
  return Math.abs(points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + x * ny - nx * y;
  }, 0)) / 2;
}

function contains(points: Point[], px: number, py: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

describe("block catalog", () => {
  it("has unique slugs", () => {
    expect(new Set(BLOCKS.map((b) => b.slug)).size).toBe(BLOCKS.length);
  });

  it.each(BLOCKS.map((b) => [b.slug, b] as const))("%s fills its grid exactly once", (_, block) => {
    const pieces = blockPieces(block);
    expect(pieces.reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(block.grid ** 2, 6);
    // Irregular sample points, so none land on a seam.
    for (let i = 0; i < 400; i++) {
      const x = ((i * 0.6180339887 + 0.0137) % 1) * block.grid;
      const y = ((i * 0.7548776662 + 0.0291) % 1) * block.grid;
      expect(pieces.filter((p) => contains(p.points, x, y))).toHaveLength(1);
    }
  });

  it.each(BLOCKS.map((b) => [b.slug, b] as const))("%s uses only fabrics it declares, and all of them", (_, block) => {
    const declared = block.fabrics.map((f) => f.id).sort();
    const used = [...new Set(blockPieces(block).map((p) => p.fabric))].sort();
    expect(used).toEqual(declared);
  });

  it("finds blocks by slug", () => {
    expect(getBlock("ohio-star")?.name).toBe("Ohio Star");
    expect(getBlock("nope")).toBeUndefined();
  });
});
