import { describe, expect, it } from "vitest";
import { changedSettings } from "./analytics";

describe("changedSettings", () => {
  it("names only the settings that differ", () => {
    expect(changedSettings({ grid: 4, weight: 10 }, { grid: 6, weight: 10 })).toEqual(["grid"]);
  });

  it("compares nested settings by value and leaves their values out", () => {
    expect(changedSettings({ colors: { line: "#000000" }, grid: 4 }, { colors: { line: "#ffffff" }, grid: 4 })).toEqual(["colors"]);
    expect(changedSettings({ colors: { line: "#000000" } }, { colors: { line: "#000000" } })).toEqual([]);
  });

  it("notices a setting that appears or goes away", () => {
    expect(changedSettings({ cols: 10 }, { rows: 10 })).toEqual(["cols", "rows"]);
  });
});
