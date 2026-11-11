import { describe, expect, it } from "vitest";
import { libraryTypes, patternTypeLinks, seasonalHrefs } from "./libraryTools";
import { activeSeason, getSeason, SEASONS } from "./seasons";

describe("seasons", () => {
  it("are on in their own months, and winter covers the holidays", () => {
    expect(activeSeason(new Date("2026-12-15T12:00:00Z"))?.id).toBe("winter");
    expect(activeSeason(new Date("2027-01-20T12:00:00Z"))?.id).toBe("winter");
    expect(activeSeason(new Date("2026-07-04T12:00:00Z"))).toBeUndefined();
    for (const season of SEASONS) for (const month of season.months) expect(month).toBeGreaterThanOrEqual(1);
  });

  it("name the library pages of their designs, and only pages the library has", async () => {
    const winter = getSeason("winter")!;
    const hrefs = seasonalHrefs(winter, "en");
    for (const href of ["/cross-stitch/snowman/", "/cross-stitch/mittens/", "/origami/santa-hat/", "/origami/christmas-tree/", "/blocks/snowball/"]) expect(hrefs).toContain(href);
    // A maze sample is its hidden message, which the library's picture of that maze doesn't show.
    expect([...hrefs].some((href) => href.startsWith("/mazes/"))).toBe(false);
    const library = new Set((await libraryTypes("en", winter)).flatMap((type) => type.inSeason.map((sample) => sample.href)));
    expect(library).toEqual(hrefs);
  });
});

describe("the library in season", () => {
  it("puts the season's designs first in each type, and leaves the order alone out of season", async () => {
    const winter = getSeason("winter")!;
    const inSeason = await libraryTypes("en", winter);
    const crossStitch = inSeason.find((type) => type.id === "crossStitch")!;
    expect(crossStitch.samples.every((sample) => sample.seasonal)).toBe(true);
    const plain = await libraryTypes("en");
    expect(plain.flatMap((type) => type.inSeason)).toEqual([]);
    expect(plain.find((type) => type.id === "crossStitch")!.samples[0]!.seasonal).toBeUndefined();
  });

  it("works in every language", async () => {
    const winter = getSeason("winter")!;
    for (const locale of ["es", "fr", "de", "pt", "it", "nl"] as const) {
      const types = await libraryTypes(locale, winter);
      expect(types.flatMap((type) => type.inSeason).length).toBe(seasonalHrefs(winter, locale).size);
    }
  });
});

describe("the site menu", () => {
  it("links every pattern type once, alphabetically", () => {
    const links = patternTypeLinks("en");
    expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
    expect(links.map((link) => link.title)).toEqual([...links.map((link) => link.title)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  });
});
