import { describe, expect, it } from "vitest";
import { encodeSettings } from "./mazeApi";

describe("settings in a URL", () => {
  it("makes one URL for the same settings, whatever their order", () => {
    expect(encodeSettings({ a: 1, colors: { x: "1", y: "2" } })).toBe(encodeSettings({ colors: { y: "2", x: "1" }, a: 1 }));
    expect(encodeSettings({ list: [2, 1] })).not.toBe(encodeSettings({ list: [1, 2] }));
  });

  it("spells each setting out, so a URL can be read as it is", () => {
    expect(encodeSettings({ shape: "square", seed: 7, cols: undefined })).toBe("seed=7&shape=square");
  });

  it("round trips text, numbers and nested settings", () => {
    const query = new URLSearchParams(encodeSettings({ message: "¿QUÉ? 1+1 & ♥", seed: 7, colors: { wall: "#111111" }, list: [{ b: 1, a: null }] }));
    expect(query.get("message")).toBe("¿QUÉ? 1+1 & ♥");
    expect(JSON.parse(query.get("seed") as string)).toBe(7);
    expect(JSON.parse(query.get("colors") as string)).toEqual({ wall: "#111111" });
    expect(query.get("list")).toBe('[{"a":null,"b":1}]');
  });
});
