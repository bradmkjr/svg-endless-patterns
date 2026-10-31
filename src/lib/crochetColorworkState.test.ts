import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/crochetColorwork.json";
import { COLORWORK_DESIGNS, defaultCrochetColorworkState, parseCrochetColorworkState, serializeCrochetColorworkState } from "./crochetColorworkState";
import { getStitchPatterns } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("designs", () => {
  it("don't take a stitch's page", async () => {
    expect((await getStitchPatterns("crochet")).some((s) => s.slug === "colorwork")).toBe(false);
  });

  it.each(LOCALES)("are named in %s", (locale) => {
    expect(Object.keys(uiText[locale]).sort()).toEqual(Object.keys(uiText.en).sort());
    expect(Object.keys(uiText[locale].designs).sort()).toEqual(COLORWORK_DESIGNS.map((d) => d.id).sort());
  });
});

describe("share links", () => {
  it.each(LOCALES)("start empty and round trip in %s", (locale) => {
    expect(serializeCrochetColorworkState(defaultCrochetColorworkState(locale))).toBe("");
    const query = "d=meadow&c=112233&cc=aa0000-00aa00-0000aa&w=bulky&r=2";
    const parsed = parseCrochetColorworkState(new URLSearchParams(query), locale);
    expect(parsed).toMatchObject({ design: "meadow", color: "#112233", contrast: ["#aa0000", "#00aa00", "#0000aa"], weight: "bulky", repeats: 2 });
    expect(serializeCrochetColorworkState(parsed).split("&").sort()).toEqual(query.split("&").sort());
  });

  it.each([
    ["d", "nope"],
    ["c", "red"],
    ["cc", "zzzzzz"],
    ["cc", "aaaaaa-bbbbbb-cccccc-dddddd"],
    ["w", "lace"],
    ["r", "9"],
    ["r", "1.5"],
  ])("fall back on %s=%s", (key, value) => {
    expect(serializeCrochetColorworkState(parseCrochetColorworkState(new URLSearchParams(`${key}=${value}`)))).toBe("");
  });

  it("fit the contrast colors to the design", () => {
    expect(parseCrochetColorworkState(new URLSearchParams("d=frost&cc=aa0000-00aa00")).contrast).toEqual(["#aa0000"]);
    expect(parseCrochetColorworkState(new URLSearchParams("d=meadow&cc=aa0000")).contrast).toHaveLength(3);
  });

  it("carry no seed", () => {
    expect(new URLSearchParams(serializeCrochetColorworkState({ ...defaultCrochetColorworkState("en", "ember"), weight: "dk" })).has("seed")).toBe(false);
  });
});

describe("language", () => {
  it("changes one secondary color only", () => {
    for (const { id } of COLORWORK_DESIGNS) {
      const en = defaultCrochetColorworkState("en", id);
      for (const locale of LOCALES) {
        const local = defaultCrochetColorworkState(locale, id);
        expect(local.color).toBe(en.color);
        expect(local.contrast!.slice(1)).toEqual(en.contrast!.slice(1));
      }
    }
  });
});
