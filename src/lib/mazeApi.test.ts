import { describe, expect, it } from "vitest";
import { encodeSettings } from "./mazeApi";

const decode = (q: string) => JSON.parse(Buffer.from(q, "base64url").toString("utf8"));

describe("settings in a URL", () => {
  it("makes one URL for the same settings, whatever their order", () => {
    expect(encodeSettings({ a: 1, colors: { x: "1", y: "2" } })).toBe(encodeSettings({ colors: { y: "2", x: "1" }, a: 1 }));
    expect(encodeSettings({ list: [2, 1] })).not.toBe(encodeSettings({ list: [1, 2] }));
  });

  it("round trips accents and symbols with only URL-safe characters", () => {
    const settings = { message: "¿QUÉ TAL, AÑO? ♥", list: [{ b: 1, a: null }], cols: undefined };
    const q = encodeSettings(settings);
    expect(q).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decode(q)).toEqual({ message: settings.message, list: [{ a: null, b: 1 }] });
  });
});
