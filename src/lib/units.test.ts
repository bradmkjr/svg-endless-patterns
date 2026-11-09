import { describe, expect, it } from "vitest";
import catalog from "./patternCatalog.json";
import type { BlockInfo } from "./generator";
import { DESIGN_IDS, defaultQuiltState, gridOf, parseQuiltState, quiltWithUnits, serializeQuiltState } from "./quiltState";
import { defaultState, parseState, serializeState, withUnits } from "./state";
import { convertLength, defaultUnits, formatLength, MEASURES } from "./units";

const ohio = catalog.blocks.en.find((block) => block.slug === "ohio-star") as BlockInfo;
const params = (query: string) => new URLSearchParams(query);

describe("units", () => {
  it("open in inches in English and centimeters in every other language", () => {
    expect(defaultUnits("en")).toBe("in");
    for (const locale of ["es", "fr", "de", "pt", "it", "nl"] as const) expect(defaultUnits(locale)).toBe("cm");
    expect(defaultState(ohio, "en").units).toBeUndefined();
    expect(defaultState(ohio, "fr")).toMatchObject({ units: "cm", size: 30, border: 7.5, wof: 105 });
  });

  it("show menu lengths in the reader's decimals", () => {
    expect(formatLength(3.5, "in", "en")).toBe('3.5"');
    expect(formatLength(7.5, "cm", "de")).toBe("7,5 cm");
    expect(formatLength(7.5, "cm", "en")).toBe("7.5 cm");
  });

  it("name themselves in a link only when they aren't the language's own", () => {
    expect(serializeState(ohio, defaultState(ohio, "fr"))).toBe("");
    const inches = withUnits(ohio, defaultState(ohio, "fr"), "in");
    const query = serializeState(ohio, inches);
    expect(query).toContain("units=in");
    expect(parseState(ohio, params(query), "fr")).toEqual(inches);
    const metric = withUnits(ohio, defaultState(ohio, "en"), "cm");
    expect(parseState(ohio, params(serializeState(ohio, metric)), "en")).toEqual(metric);
  });

  it("convert a block to a size that cuts on the metric ruler", () => {
    // 12" is 30.48 cm; 30 cm puts a 3-grid Ohio Star's squares at 10 cm.
    expect(withUnits(ohio, defaultState(ohio, "en"), "cm")).toMatchObject({ size: 30, border: 7.5, wof: 105 });
    expect(convertLength(9, "in", "cm", MEASURES.cm.size, [3])).toBe(22.5);
    expect(convertLength(22.5, "cm", "in", MEASURES.in.size, [3])).toBe(9);
  });

  it("give every quilt design a metric size its blocks cut cleanly at, close to the original", () => {
    for (const id of DESIGN_IDS) {
      const inches = defaultQuiltState("en", id);
      const metric = defaultQuiltState("fr", id);
      expect(MEASURES.cm.size, id).toContain(metric.size);
      expect(MEASURES.cm.border, id).toContain(metric.border);
      expect(MEASURES.cm.sashing, id).toContain(metric.sashing);
      expect(Math.abs(metric.size / 2.54 - inches.size) / inches.size, id).toBeLessThan(0.08);
      expect(serializeQuiltState(metric), id).toBe(id === DESIGN_IDS[0] ? "" : `d=${id}`);
      expect(parseQuiltState(params(serializeQuiltState(metric)), "fr"), id).toEqual(metric);
    }
    expect(defaultQuiltState("de").size).toBe(22.5);
    expect(gridOf("plain")).toBe(1);
  });

  it("switch a quilt between systems and back to where it started", () => {
    const start = defaultQuiltState("en");
    const there = quiltWithUnits(start, "cm");
    expect(there).toMatchObject({ units: "cm", size: 22.5, border: 10, wof: 105 });
    expect(quiltWithUnits(there, "in")).toEqual(start);
    expect(parseQuiltState(params(serializeQuiltState(there)), "en")).toEqual(there);
  });
});
