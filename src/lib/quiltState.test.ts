import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/quilt.json";
import { BLOCK_CHOICES, DEFAULT_DESIGN, DESIGN_IDS, DESIGN_PARAMS, DESIGNS, defaultQuiltState, parseQuiltState, PLAIN, QUILTING_OPTIONS, serializeQuiltState, type QuiltState } from "./quiltState";
import { optionHref, TOOL_OPTIONS, withOption } from "./toolOptions";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("quilt state", () => {
  const full: QuiltState = {
    design: "star-sampler",
    arrangement: "sampler",
    blocks: ["ohio-star", PLAIN, "log-cabin"],
    size: 10.5,
    cols: 3,
    rows: 9,
    sashing: 1.5,
    border: 0,
    setting: "alternate",
    wof: 42,
    palette: ["#010203", "#a0b0c0", "#ffeedd"],
    sashingColor: "#123456",
    borderColor: "#654321",
    noise: 60,
    scrappy: true,
    seed: 7,
    quilting: "crosshatch",
    showQuilting: false,
    thread: "#abcdef",
    batting: "polyester",
  };

  it.each(LOCALES)("keeps the default out of the link, and reads back every setting, in %s", (locale) => {
    expect(serializeQuiltState(defaultQuiltState(locale))).toBe("");
    const state = locale === "en" ? full : { ...full, locale };
    expect(parseQuiltState(new URLSearchParams(serializeQuiltState(state)), locale)).toEqual(state);
  });

  it("reads each design's own defaults, and writes only what differs from them", () => {
    for (const id of DESIGN_IDS) {
      const state = defaultQuiltState("en", id);
      expect(serializeQuiltState(state)).toBe(id === DEFAULT_DESIGN ? "" : `d=${id}`);
      expect(parseQuiltState(withOption("quilt", id))).toEqual(state);
    }
  });

  it("leaves the seed out of links, as other tools do", () => {
    expect(serializeQuiltState({ ...defaultQuiltState(), seed: 123 })).toBe("");
    expect(parseQuiltState(new URLSearchParams("seed=123")).seed).toBe(123);
  });

  it("falls back to the default for anything it can't read", () => {
    const base = defaultQuiltState();
    expect(parseQuiltState(new URLSearchParams("d=nope&arr=x&a=nope.zilch&size=1&noise=55&p=zz-11&q=wiggle&bat=wool&th=red"))).toEqual(base);
    expect(parseQuiltState(new URLSearchParams("p=111111")).palette).toEqual(base.palette);
    expect(parseQuiltState(new URLSearchParams("a=ohio-star.nope.plain")).blocks).toEqual(["ohio-star", PLAIN]);
  });

  it("uses only real blocks, and offers a plain square", () => {
    expect(BLOCK_CHOICES).toContain(PLAIN);
    for (const { settings } of DESIGNS) for (const slug of settings.blocks) expect(BLOCK_CHOICES).toContain(slug);
  });

  it("has a page for each design, and leaves a design's own settings behind on the next one", () => {
    expect(TOOL_OPTIONS.quilt.options.map((o) => o.slug)).toEqual(DESIGN_IDS);
    const href = optionHref("quilt", "en", "charm-squares", "?d=star-sampler&a=ohio-star&size=6&p=111111-222222&bat=none");
    expect(href).toBe("/quilts/charm-squares/?p=111111-222222&bat=none");
    for (const key of DESIGN_PARAMS) expect(href).not.toContain(`${key}=`);
  });

  it.each(LOCALES)("names every design, arrangement choice and quilting design in %s", (locale) => {
    for (const id of DESIGN_IDS) {
      expect(uiCopy[locale].designs[id as keyof (typeof uiCopy)["en"]["designs"]]).toBeTruthy();
      expect(uiCopy[locale].designNotes[id as keyof (typeof uiCopy)["en"]["designNotes"]]).toBeTruthy();
    }
    for (const id of QUILTING_OPTIONS) expect(uiCopy[locale].quiltings[id]).toBeTruthy();
  });

  it("gives every language the same colors except one secondary", () => {
    expect(new Set(LOCALES.map((l) => defaultQuiltState(l).palette.join())).size).toBe(7);
    for (const l of LOCALES) expect(defaultQuiltState(l).palette[1]).toBe(defaultQuiltState().palette[1]);
  });
});
