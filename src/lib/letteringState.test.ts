import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/lettering.json";
import { defaultLetteringState, FONT_OPTIONS, LAYOUT_OPTIONS, letteringRequest, MESSAGE_LIMITS, messageCounts, parseLetteringState, PRESETS, serializeLetteringState, TECHNIQUE_OPTIONS, TECHNIQUE_SLUGS, withPreset } from "./letteringState";
import { optionHref, TOOL_OPTIONS, withOption } from "./toolOptions";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;
type Tree = { [key: string]: string | Tree };
const keys = (tree: Tree, prefix = ""): string[] => Object.entries(tree).flatMap(([key, value]) => (typeof value === "string" ? [prefix + key] : keys(value, `${prefix}${key}.`))).sort();
const holes = (tree: Tree, path: string) => [...String(path.split(".").reduce<Tree | string>((node, key) => (node as Tree)[key]!, tree)).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("text", () => {
  it.each(LOCALES)("has every key and placeholder in %s", (locale) => {
    const en = uiText.en as unknown as Tree;
    const local = uiText[locale] as unknown as Tree;
    expect(keys(local)).toEqual(keys(en));
    for (const key of keys(en)) expect(holes(local, key), `${locale} ${key}`).toEqual(holes(en, key));
  });

  it("names every font, layout, technique and preset", () => {
    expect(Object.keys(uiText.en.fonts).sort()).toEqual([...FONT_OPTIONS].sort());
    expect(Object.keys(uiText.en.layouts).sort()).toEqual([...LAYOUT_OPTIONS].sort());
    expect(Object.keys(uiText.en.techniques).sort()).toEqual([...TECHNIQUE_OPTIONS].sort());
    expect(Object.keys(uiText.en.presets).sort()).toEqual(PRESETS.map((p) => p.id).sort());
  });

  it.each(LOCALES)("keeps every preset within the limits in %s", (locale) => {
    for (const preset of Object.values(uiText[locale].presets)) {
      const counts = messageCounts(preset.text);
      expect(counts.characters).toBeLessThanOrEqual(MESSAGE_LIMITS.characters);
      expect(counts.lines).toBeLessThanOrEqual(MESSAGE_LIMITS.lines);
    }
  });
});

describe("share links", () => {
  it.each(LOCALES)("start empty and round trip in %s", (locale) => {
    expect(serializeLetteringState(defaultLetteringState(locale))).toBe("");
    const query = "t=c2c&m=Dr.+Jim+%26+Hannah%0AJune+12%2C+2027&f=serif&h=14&h2=9&l=squares&a=left&s=2&g=4&mg=6&b=0&c=112233-445566-778899&w=bulky";
    const parsed = parseLetteringState(new URLSearchParams(query), locale);
    expect(parsed).toMatchObject({ technique: "c2c", message: "Dr. Jim & Hannah\nJune 12, 2027", font: "serif", height: 14, height2: 9, layout: "squares", align: "left", spacing: 2, lineGap: 4, margin: 6, border: 0, colors: ["#112233", "#445566", "#778899"], weight: "bulky" });
    expect(serializeLetteringState(parsed).split("&").sort()).toEqual(query.split("&").sort());
  });

  it("keeps a quilt's square", () => {
    const parsed = parseLetteringState(new URLSearchParams("t=quilt&q=1.5"));
    expect(parsed.square).toBe(1.5);
    expect(serializeLetteringState(parsed)).toBe("t=quilt&q=1.5");
  });

  it.each([
    ["t", "knit"],
    ["m", "   "],
    ["f", "comic"],
    ["h", "4"],
    ["h", "61"],
    ["h", "1e1"],
    ["l", "circle"],
    ["a", "center"],
    ["s", "9"],
    ["mg", "-1"],
    ["b", "7"],
    ["c", "red-green-blue"],
    ["c", "aaaaaa-bbbbbb"],
    ["w", "lace"],
    ["q", "1.75"],
  ])("fall back on %s=%s", (key, value) => {
    expect(serializeLetteringState(parseLetteringState(new URLSearchParams(`${key}=${value}`)))).toBe("");
  });

  it("drop a later line's height that matches the first", () => {
    expect(serializeLetteringState(parseLetteringState(new URLSearchParams("h=20&h2=20")))).toBe("h=20");
  });

  it("carry the words and type from one technique's page to the next", () => {
    const search = "m=Emma+Rose&f=script&h=16";
    for (const technique of TECHNIQUE_OPTIONS) {
      const href = optionHref("lettering", "en", TECHNIQUE_SLUGS[technique], `t=tapestry&${search}`);
      expect(href).toBe(`/lettering/${TECHNIQUE_SLUGS[technique]}/?${search}`);
      expect(parseLetteringState(withOption("lettering", TECHNIQUE_SLUGS[technique], search)).technique).toBe(technique);
    }
    expect(TOOL_OPTIONS.lettering.options.map((o) => o.slug)).toEqual(TECHNIQUE_OPTIONS.map((t) => TECHNIQUE_SLUGS[t]));
  });
});

describe("requests", () => {
  it("send only the settings the technique uses", () => {
    const crochet = letteringRequest(defaultLetteringState("en", "c2c"));
    expect(crochet).toHaveProperty("weight", "worsted");
    expect(crochet).not.toHaveProperty("square");
    const quilt = letteringRequest(defaultLetteringState("en", "quilt"));
    expect(quilt).toHaveProperty("square", 2);
    expect(quilt).not.toHaveProperty("weight");
  });

  it("apply a preset's words in the page's language, and smaller sizes for a quilt", () => {
    const wedding = PRESETS.find((p) => p.id === "wedding")!;
    const de = withPreset({ ...defaultLetteringState("de"), spacing: 4 }, wedding, "de");
    expect(de.message).toBe(uiText.de.presets.wedding.text);
    expect(de.spacing).toBeUndefined();
    expect(de.technique).toBe("tapestry");
    const quilt = withPreset(defaultLetteringState("en", "quilt"), wedding, "en");
    expect(quilt).toMatchObject({ font: "pixel", height: 7, square: 1 });
  });

  it("count characters and lines as the API does", () => {
    expect(messageCounts("  Emma \n\n  June  2027 ")).toEqual({ lines: 2, characters: 13 });
  });
});

describe("language", () => {
  it("changes the border color only", () => {
    const en = defaultLetteringState("en");
    for (const locale of LOCALES) {
      const local = defaultLetteringState(locale);
      expect(local.colors.slice(0, 2)).toEqual(en.colors.slice(0, 2));
    }
  });
});
