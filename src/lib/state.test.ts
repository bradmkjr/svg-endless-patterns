import { describe, expect, it } from "vitest";
import { getBlock } from "./generator";
import { defaultState, paletteColors, PALETTES, parseState, serializeState } from "./state";

describe("share links", async () => {
  const ohio = (await getBlock("ohio-star"))!;

  it("omits defaults", () => {
    expect(serializeState(ohio, defaultState(ohio))).toBe("");
  });

  it("round-trips every setting", () => {
    const state = {
      ...defaultState(ohio),
      size: 9.5,
      cols: 7,
      rows: 8,
      sashing: 1.5,
      border: 0,
      wof: 42,
      seams: true,
      setting: "quadrants" as const,
      colors: paletteColors(ohio, PALETTES[2]),
    };
    expect(parseState(ohio, new URLSearchParams(serializeState(ohio, state)))).toEqual(state);
  });

  it("falls back on bad input", () => {
    const parsed = parseState(ohio, new URLSearchParams("size=1000&cols=-1&set=sideways&f_star=<script>&rows=abc"));
    expect(parsed).toEqual(defaultState(ohio));
  });
});
