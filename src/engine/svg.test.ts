import { describe, expect, it } from "vitest";
import { BLOCKS, getBlock } from "./blocks";
import { blockSvg, blockTurn, quiltSvg, tileSvg } from "./svg";
import { blockTemplates, offsetOutline } from "./templates";
import { defaultRequest as defaultState } from "./testRequest";
import { pieceSteps } from "./steps";

const ohio = getBlock("ohio-star")!;

describe("svg output", () => {
  it("draws physical inches for export", () => {
    const svg = blockSvg(ohio, 12, defaultState(ohio).colors);
    expect(svg).toContain('width="12in"');
    expect(svg).toContain('viewBox="0 0 12 12"');
  });

  it("gives a straight setting a tile of one block and sashing", () => {
    const svg = tileSvg(ohio, { ...defaultState(ohio), size: 12, sashing: 2 });
    expect(svg).toContain('viewBox="0 0 14 14"');
  });

  it("doubles the tile when blocks are turned, so the cycle closes", () => {
    const svg = tileSvg(ohio, { ...defaultState(ohio), size: 12, sashing: 0, setting: "alternate" });
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain("rotate(90 6 6)");
  });

  it("sizes the quilt to its layout", () => {
    const svg = quiltSvg(ohio, { ...defaultState(ohio), size: 12, cols: 2, rows: 3, sashing: 1, border: 2 });
    expect(svg).toContain('viewBox="0 0 29 42"');
  });

  it("turns blocks by setting", () => {
    expect(blockTurn("straight", 1, 0, 4, 4)).toBe(0);
    expect(blockTurn("alternate", 1, 0, 4, 4)).toBe(1);
    expect(blockTurn("quadrants", 3, 3, 4, 4)).toBe(2);
  });
});

describe("templates", () => {
  it("adds a quarter inch around a square", () => {
    const out = offsetOutline([[0, 0], [2, 0], [2, 2], [0, 2]], 0.25);
    expect(out[0][0]).toBeCloseTo(-0.25);
    expect(out[0][1]).toBeCloseTo(-0.25);
    expect(out[2][0]).toBeCloseTo(2.25);
  });

  it("matches the 7/8 rule for half-square triangles", () => {
    const [tri] = blockTemplates(getBlock("pinwheel")!, 6);
    const xs = tri.cutting.map(([x]) => x);
    // Cut square = leg + 7/8: the template's legs span that same distance.
    const ys = tri.cutting.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(3 + 0.25 + 0.25 + 0.25 * Math.SQRT2, 6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(3 + 0.25 + 0.25 + 0.25 * Math.SQRT2, 6);
  });

  it("groups one template per shape and counts by fabric", () => {
    const templates = blockTemplates(ohio, 12, 2);
    expect(templates).toHaveLength(2);
    const square = templates.find((t) => t.shape === "rect")!;
    expect(square.counts).toEqual(expect.arrayContaining([{ fabric: "ground", count: 8 }, { fabric: "center", count: 2 }]));
  });
});

describe("piecing steps", () => {
  it("names the units a block contains and its measured size", () => {
    const steps = pieceSteps(ohio, 12).join(" ");
    expect(steps).toContain("Make 4 quarter-square triangle units");
    expect(steps).toContain('trim to 4 1/2" square');
    expect(steps).toContain('12 1/2" square');
  });

  it("writes steps for every block at an off-ruler size", () => {
    for (const block of BLOCKS) expect(pieceSteps(block, 11).length).toBeGreaterThanOrEqual(3);
  });
});

describe("template shapes", () => {
  it("offsets a concave curved piece outward everywhere", () => {
    const [template] = blockTemplates(getBlock("drunkards-path")!, 12).filter((t) => t.name === "Curved corner");
    expect(template.cutting).toHaveLength(template.finished.length);
    const xs = template.finished.map(([x]) => x);
    const cutXs = template.cutting.map(([x]) => x);
    expect(Math.max(...cutXs)).toBeCloseTo(Math.max(...xs) + 0.25, 1);
    expect(template.cutting.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
  });

  it("keeps one template per named shape", () => {
    const names = blockTemplates(getBlock("lemoyne-star")!, 12).map((t) => t.name);
    expect(names.sort()).toEqual(["Corner square", "Diamond", "Side triangle"]);
  });
});
