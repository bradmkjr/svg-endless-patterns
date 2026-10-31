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

describe("stitch share links", async () => {
  const { getStitchPattern } = await import("./generator");
  const { defaultStitchState, parseStitchState, serializeStitchState } = await import("./stitchState");
  const seed = (await getStitchPattern("knit", "seed-stitch"))!;

  it("omits defaults and round-trips changes", () => {
    expect(serializeStitchState(seed, defaultStitchState(seed))).toBe("");
    const state = { width: 50, length: 60, stitchGauge: 22, rowGauge: 30, color: "#b5533c" };
    expect(parseStitchState(seed, new URLSearchParams(serializeStitchState(seed, state)))).toEqual(state);
  });

  it("falls back on bad input", () => {
    expect(parseStitchState(seed, new URLSearchParams("w=9999&l=x&sts=-1&color=red"))).toEqual(defaultStitchState(seed));
  });
});

describe("tartan share links", async () => {
  const { defaultTartanState, parseTartanState, serializeTartanState } = await import("./tartanState");

  it("omits defaults and round-trips changes", () => {
    expect(serializeTartanState(defaultTartanState())).toBe("");
    const state = { stripes: [{ color: "#112233", count: 8 }, { color: "#445566", count: 2 }], mirrored: false, threadsPerInch: 32, width: 20, length: 40 };
    expect(parseTartanState(new URLSearchParams(serializeTartanState(state)))).toEqual(state);
  });

  it("falls back on bad input", () => {
    expect(parseTartanState(new URLSearchParams("s=zzz.9&tpi=9999&w=x"))).toEqual(defaultTartanState());
  });
});
