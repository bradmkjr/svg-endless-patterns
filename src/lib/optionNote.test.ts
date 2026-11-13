import { describe, expect, it } from "vitest";
import { SITE_LOCALES } from "./i18n";
import { optionNote, TOOL_OPTIONS, type ToolId } from "./toolOptions";
import { withinLength } from "./toolPages";

/** Tools whose choices each say what sets them apart, on their page and in its description. */
const WITH_NOTES: ToolId[] = ["life", "fractal", "checkerboard", "kolam", "origami", "origamiTessellation", "quilt", "weaving", "kaleidoscope", "tieDye", "sashiko", "maze", "truchet", "waves", "chineseLattice"];

describe("option notes", () => {
  it.each(WITH_NOTES)("cover every choice of %s in every language", (tool) => {
    for (const { code } of SITE_LOCALES) {
      for (const { slug } of TOOL_OPTIONS[tool].options) expect(optionNote(tool, slug, code), `${tool} ${slug} ${code}`).toBeTruthy();
    }
  });

  it("are left out for an unknown choice", () => {
    expect(optionNote("tieDye", "no-such-fold", "en")).toBeUndefined();
  });
});

describe("withinLength", () => {
  it("adds whole sentences only while they fit in a search result", () => {
    expect(withinLength("Beehive: A still life of 6 cells.", "Short one. " + "x".repeat(200) + ".")).toBe("Beehive: A still life of 6 cells. Short one.");
  });

  it("keeps a long lead as it is", () => {
    const lead = "y".repeat(170);
    expect(withinLength(lead, "More.")).toBe(lead);
  });
});
