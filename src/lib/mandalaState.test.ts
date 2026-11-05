import { describe, expect, it } from "vitest";
import uiText from "../i18n/messages/mandala.json";
import { defaultMandalaState, moveRing, parseMandalaState, serializeMandalaState, SIZE_OPTIONS, STYLE_OPTIONS } from "./mandalaState";
import type { MandalaRequest, MandalaRingSpec } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("older links", () => {
  it("keeps a seed's design, unchanged by the new motifs", () => {
    const { motifs } = parseMandalaState(new URLSearchParams("seed=7"));
    expect(motifs).toEqual(["petals", "arcs", "dots", "scallops", "diamonds", "triangles"]);
  });
});

describe("share links", () => {
  const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseMandalaState(new URLSearchParams(query), locale);

  it.each(LOCALES)("has an empty link for the %s defaults", (locale) => {
    expect(serializeMandalaState(defaultMandalaState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultMandalaState(locale));
  });

  it("round trips a ring plan", () => {
    const ringPlan: MandalaRingSpec[] = [
      { motif: "lotus", repeat: 1, size: 96, color: 2, band: null, accent: true, offset: false },
      { motif: "hearts", repeat: 16, size: 200, color: 0, band: 3, accent: false, offset: true },
    ];
    const state: MandalaRequest = { ...defaultMandalaState(), ringPlan };
    expect(parse(serializeMandalaState(state))).toEqual(state);
  });

  it.each(["rs=lotus", "rs=stars9.1.100.0.x.0.0", "rs=lotus.99.100.0.x.0.0", "rs=lotus.1.10.0.x.0.0", "rs=lotus.1.100.9.x.0.0", "rs=lotus.1.100.0.9.0.0", "rs=lotus.1.100.0.x.2.0", "rs=lotus.1.100.0.x.0.0.0", "rs=%3Cscript%3E"])("uses the default rings for the bad plan %s", (query) => {
    expect(parse(query).ringPlan).toEqual(defaultMandalaState().ringPlan);
  });

  it("keeps seeds out of links, but still reads them in older ones", () => {
    expect(serializeMandalaState({ ...defaultMandalaState(), seed: 999, ringPlan: undefined })).not.toContain("999");
    expect(parse("seed=999").seed).toBe(999);
  });

  it("tells seeded links from ring plans", () => {
    expect(parse("seed=5").ringPlan).toBeUndefined();
    expect(parse("r=4").ringPlan).toBeUndefined();
    expect(parse("n=8").ringPlan).toEqual(defaultMandalaState().ringPlan);
    const seeded = { ...defaultMandalaState(), ringPlan: undefined };
    expect({ ringPlan: undefined, ...parse(serializeMandalaState(seeded)) }).toEqual(seeded);
  });

  it("offers only rings the plan encoding accepts", () => {
    for (const size of SIZE_OPTIONS) expect(parse(`rs=lotus.1.${size}.0.x.0.0`).ringPlan![0].size).toBe(size);
  });

  it("round trips every setting", () => {
    const state: MandalaRequest = { symmetry: 17, rings: 3, motifs: ["arcs", "diamonds"], seed: 12, lineWeight: 6, colors: ["#123456", "#abcdef"], background: "#101010", outline: "#fedcba" };
    expect(parse(serializeMandalaState(state))).toEqual(state);
    expect(parse(serializeMandalaState({ ...state, locale: "de" }), "de")).toEqual({ ...state, locale: "de" });
  });

  it.each(["n=8&m=petals.dots", "n=16&r=7", "n=24&r=4&m=scallops.diamonds", "n=8&seeded=1"])("%s survives a round trip", (query) => {
    expect(serializeMandalaState(parse(query))).toBe(query);
  });

  it.each([
    ["n=5", "symmetry"],
    ["n=25", "symmetry"],
    ["n=abc", "symmetry"],
    ["n=8.5", "symmetry"],
    ["r=1", "rings"],
    ["r=99", "rings"],
    ["m=petals.comets", "motifs"],
    ["m=", "motifs"],
    ["seed=-1", "seed"],
    ["seed=1234567", "seed"],
    ["seed=abc", "seed"],
    ["w=5", "lineWeight"],
    ["k=zzzzzz", "colors"],
    ["k=123456-12", "colors"],
    ["k=111111-222222-333333-444444-555555-666666-777777", "colors"],
    ["bg=red", "background"],
    ["ol=%22/%3E", "outline"],
  ] as const)("ignores the bad value %s", (query, field) => {
    expect(parse(query)[field]).toEqual(defaultMandalaState()[field]);
  });

  it("gives each language its own colors", () => {
    const looks = LOCALES.map((locale) => defaultMandalaState(locale).colors.join());
    expect(new Set(looks).size).toBe(LOCALES.length);
  });

  describe("drawing styles", () => {
    it("gives each style its own colors", () => {
      const looks = STYLE_OPTIONS.map((style) => {
        const { colors, background, outline } = defaultMandalaState("en", style);
        return [background, outline, ...colors].join();
      });
      expect(new Set(looks).size).toBe(STYLE_OPTIONS.length);
    });

    it("keeps the classic colors, so older links look the same", () => {
      expect(defaultMandalaState("en", "classic")).toEqual(defaultMandalaState());
      expect(defaultMandalaState().colors).toEqual(["#23395d", "#2f7f79", "#d98e32", "#b8473d"]);
    });

    it.each(LOCALES)("changes only the secondary color in %s", (locale) => {
      for (const style of STYLE_OPTIONS) {
        const english = defaultMandalaState("en", style);
        const local = defaultMandalaState(locale, style);
        expect(local.background).toBe(english.background);
        expect(local.outline).toBe(english.outline);
        expect(local.colors.filter((c, i) => c !== english.colors[i]).length).toBe(locale === "en" ? 0 : 1);
      }
    });

    it.each(STYLE_OPTIONS)("opens %s in its own colors, left out of the link", (style) => {
      const query = style === "classic" ? "" : `st=${style}`;
      for (const locale of LOCALES) {
        expect(parse(query, locale)).toEqual(defaultMandalaState(locale, style));
        expect(serializeMandalaState(defaultMandalaState(locale, style))).toBe(query);
      }
    });

    it.each(STYLE_OPTIONS)("keeps other colors in a %s link", (style) => {
      const st = style === "classic" ? "" : `st=${style}&`;
      const classic = defaultMandalaState();
      const state = { ...defaultMandalaState("en", style), colors: classic.colors, background: classic.background, outline: classic.outline };
      const query = serializeMandalaState(state);
      if (style !== "classic") expect(query).toBe(`k=${classic.colors.map((c) => c.slice(1)).join("-")}&bg=f7f1e3&ol=1d2b3a&st=${style}`);
      expect(parse(query)).toEqual(state);
      expect(serializeMandalaState(parse(`${st}k=111111-222222`)).split("&")).toContain("k=111111-222222");
    });
  });

});

describe("translation", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  /** Every string in a nested object, by its dotted path. */
  const flat = (value: object, prefix = ""): Record<string, string> =>
    Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));

  describe.each([["site", uiText]] as const)("%s text", (_, catalog) => {
    it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
      const english = flat(catalog.en);
      const text = flat(catalog[locale]);
      expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
      for (const [name, value] of Object.entries(english)) {
        expect(text[name], name).toBeTruthy();
        expect(placeholders(text[name]), name).toEqual(placeholders(value));
      }
    });
  });

  it("moves a ring", () => {
    const plan = defaultMandalaState().ringPlan!;
    const moved = moveRing(plan, 0, 2);
    expect(moved[2]).toBe(plan[0]);
    expect(moved).toHaveLength(plan.length);
  });

});
