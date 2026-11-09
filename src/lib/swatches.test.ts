import { describe, expect, it } from "vitest";
import text from "../i18n/messages/colorPicker.json";
import { BASIC_COLORS, complementaryRow, matchingColors, normalizeHex, shade, toHsl } from "./swatches";

describe("basic colors", () => {
  it("are eighteen distinct colors, each with a name in every language", () => {
    expect(BASIC_COLORS).toHaveLength(18);
    expect(new Set(BASIC_COLORS.map((c) => c.hex)).size).toBe(18);
    for (const copy of Object.values(text)) expect(Object.keys(copy.names).sort()).toEqual(BASIC_COLORS.map((c) => c.id).sort());
  });
});

describe("matchingColors", () => {
  it("gives twelve distinct colors, none already on the pattern", () => {
    const active = ["#23395d", "#f4ecdc", "#b5523b"];
    const colors = matchingColors(active);
    expect(colors).toHaveLength(12);
    expect(new Set(colors).size).toBe(12);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    for (const c of active) expect(colors).not.toContain(c);
  });

  it("includes the complement of a single color", () => {
    const [hue] = toHsl("#2050c0");
    const hues = matchingColors(["#2050c0"]).map((c) => toHsl(c)[0]);
    expect(hues.some((h) => Math.abs(((h - hue + 540) % 360) - 180) < 8)).toBe(true);
  });

  it("still offers twelve for grays, nothing, or one color repeated", () => {
    expect(matchingColors(["#ffffff", "#808080", "#000000"])).toHaveLength(12);
    expect(matchingColors([])).toHaveLength(12);
    expect(matchingColors(["#b5523b", "#b5523b", "#b5533c"])).toHaveLength(12);
  });

  it("ignores values that aren't colors", () => {
    expect(matchingColors(["", "nope"])).toEqual(matchingColors([]));
  });
});

describe("complementaryRow", () => {
  it("starts with the pattern's colors, once each and in order, then fills to twelve", () => {
    const { used, suggested } = complementaryRow(["#23395D", "#f4ecdc", "#23395d", "#b5523b"]);
    expect(used).toEqual(["#23395d", "#f4ecdc", "#b5523b"]);
    expect(suggested).toHaveLength(9);
    for (const c of used) expect(suggested).not.toContain(c);
  });

  it("always suggests at least six, however many colors the pattern has", () => {
    const many = ["#111111", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#888888", "#ffffff"];
    expect(complementaryRow(many).suggested).toHaveLength(6);
  });
});

describe("helpers", () => {
  it("normalizes hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("123456")).toBe("#123456");
    expect(normalizeHex("red")).toBeNull();
  });

  it("steps lighter and darker, stopping at white and black", () => {
    expect(toHsl(shade("#808080", 10))[2]).toBeGreaterThan(toHsl("#808080")[2]);
    expect(toHsl(shade("#808080", -10))[2]).toBeLessThan(toHsl("#808080")[2]);
    expect(shade("#ffffff", 20)).toBe("#ffffff");
    expect(shade("#000000", -20)).toBe("#000000");
  });
});
