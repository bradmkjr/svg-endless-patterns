import { describe, expect, it } from "vitest";
import { getBlock } from "./blocks";
import { blockCuts, layoutCuts, planQuilt, quiltSize, rulerFriendlySizes } from "./cutting";
import { inches } from "./format";
import { defaultRequest as defaultState } from "./testRequest";

const block = (slug: string) => getBlock(slug)!;
const summary = (slug: string, size: number) =>
  blockCuts(block(slug), size)
    .map((c) => `${c.fabric} ${c.method} ${c.qty}@${inches(c.w)}x${inches(c.h)}`)
    .sort();

describe("standard rotary formulas", () => {
  it('gives the textbook 12" Ohio Star', () => {
    expect(summary("ohio-star", 12)).toEqual([
      "center square 1@4 1/2x4 1/2",
      "ground quarter 2@5 1/4x5 1/4",
      "ground square 4@4 1/2x4 1/2",
      "star quarter 2@5 1/4x5 1/4",
    ]);
  });

  it('gives the textbook 12" Sawtooth Star', () => {
    expect(summary("sawtooth-star", 12)).toEqual([
      "center square 1@6 1/2x6 1/2",
      "ground quarter 1@7 1/4x7 1/4",
      "ground square 4@3 1/2x3 1/2",
      "star half 4@3 7/8x3 7/8",
    ]);
  });

  it('gives the textbook 6" Pinwheel', () => {
    expect(summary("pinwheel", 6)).toEqual(["blade half 2@3 7/8x3 7/8", "ground half 2@3 7/8x3 7/8"]);
  });

  it("shares a cut square across blocks instead of rounding up per block", () => {
    const friendship = blockCuts(block("friendship-star"), 9, 3).find((c) => c.fabric === "star" && c.method === "half")!;
    expect(friendship.pieces).toBe(12);
    expect(friendship.qty).toBe(6);
    const odd = blockCuts(block("hourglass"), 6, 1).find((c) => c.fabric === "dark")!;
    expect(odd.qty).toBe(1);
  });

  it("rounds off-ruler sizes up and flags them", () => {
    const logs = blockCuts(block("log-cabin"), 12);
    expect(logs.every((c) => c.rounded)).toBe(true);
    expect(logs.every((c) => Number.isInteger(c.w * 8) && Number.isInteger(c.h * 8))).toBe(true);
  });

  it("flags the on-point center of a square in a square at every size", () => {
    const center = blockCuts(block("square-in-a-square"), 8).find((c) => c.fabric === "center")!;
    expect(center.rounded).toBe(true);
    expect(center.w).toBe(6.25); // 8 / sqrt(2) = 5.657, + 1/2, up to the next eighth
  });
});

describe("rulerFriendlySizes", () => {
  it("suggests the multiples either side", () => {
    expect(rulerFriendlySizes(block("log-cabin"), 12)).toEqual([10.5, 14]);
    expect(rulerFriendlySizes(block("nine-patch"), 10)).toEqual([9, 10.5]);
  });

  it("ignores the on-point center", () => {
    expect(rulerFriendlySizes(block("square-in-a-square"), 8)).toEqual([7.5, 8.5]);
  });
});

describe("quilt plan", () => {
  it("sizes the top with sashing and border", () => {
    const state = { ...defaultState(block("nine-patch")), size: 9, cols: 4, rows: 5, sashing: 2, border: 3 };
    expect(quiltSize(state)).toEqual({ width: 48, height: 59, blocks: 20 });
  });

  it("counts sashing strips, cornerstones and border strips", () => {
    const state = { ...defaultState(block("nine-patch")), size: 9, cols: 4, rows: 5, sashing: 2, border: 3 };
    const [strips, stones, sides, ends] = layoutCuts(state);
    expect(strips.qty).toBe(31);
    expect(strips.w).toBe(9.5);
    expect(strips.h).toBe(2.5);
    expect(stones.qty).toBe(12);
    expect(sides.w).toBe(53.5);
    expect(ends.w).toBe(48.5);
  });

  it("works out yardage from whole strips", () => {
    const state = { ...defaultState(block("four-patch")), size: 8, cols: 5, rows: 5, sashing: 0, border: 0, wof: 40 };
    const plan = planQuilt(block("four-patch"), state);
    // 50 squares at 4 1/2": 8 per strip, so 7 strips, 31.5" + 10% = 34.65", up to 1 yd.
    expect(plan.yardage.map((y) => y.yards)).toEqual([1, 1]);
  });

  it("prices backing panels and binding strips", () => {
    const state = { ...defaultState(block("four-patch")), size: 12, cols: 4, rows: 5, sashing: 0, border: 3, wof: 40 };
    const plan = planQuilt(block("four-patch"), state);
    expect(plan.size.width).toBe(54);
    expect(plan.size.height).toBe(66);
    expect(plan.backing.panels).toBe(2);
    expect(plan.backing.yards).toBe(3.875); // crosswise, 2 x 62" x 1.1 = 136.4" = 3.79 yd
    expect(plan.binding.strips).toBe(7); // 260" / 40"
    expect(plan.binding.yards).toBe(0.625); // 17.5" x 1.1 = 19.25" = 0.53 yd
  });

  it("buys long borders as joined strips", () => {
    const state = { ...defaultState(block("four-patch")), size: 12, cols: 5, rows: 6, sashing: 0, border: 4, wof: 40 };
    const plan = planQuilt(block("four-patch"), state);
    // Sides 72.5" and ends 68.5": 141 + 137 = 278" over two cuts of 4 and 4 strips at 4 1/2".
    expect(plan.yardage.find((y) => y.fabric === "border")?.yards).toBe(1.125);
  });
});
