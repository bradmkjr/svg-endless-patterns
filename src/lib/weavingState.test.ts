import { describe, expect, it } from "vitest";
import copy from "../i18n/messages/weaving.json";
import { defaultWeavingState, NAMED_DRAFTS, normalizeWeaving, parseWeavingState, presetState, serializeWeavingState, shaftOptions, STRUCTURE_OPTIONS, STRUCTURES, tieUpOptions, WEAVING_PRESETS, weavingRequest, type WeavingState } from "./weavingState";
import { weavingDraftLinks } from "./weavingDrafts";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  it("leaves defaults out", () => {
    for (const locale of LOCALES) expect(serializeWeavingState(defaultWeavingState(locale))).toBe("");
  });

  it("round-trips every setting", () => {
    const state: WeavingState = { structure: "point-twill", shafts: 8, size: 3, tieUp: "3/1/1/3", warp: [{ color: "#112233", count: 4 }, { color: "#abcdef", count: 2 }], weft: [{ color: "#445566", count: 1 }], view: "cloth" };
    expect(parseWeavingState(new URLSearchParams(serializeWeavingState(state)))).toEqual(state);
    const pt = { ...state, locale: "pt" as const };
    expect(parseWeavingState(new URLSearchParams(serializeWeavingState(pt)), "pt")).toEqual(pt);
    const named: WeavingState = { ...defaultWeavingState(), structure: "overshot", draft: "monks-belt", shafts: 4, size: 2, tieUp: "standard" };
    expect(parseWeavingState(new URLSearchParams(serializeWeavingState(named)))).toEqual(named);
    expect(serializeWeavingState(named)).toBe("s=overshot&d=monks-belt");
  });

  it("falls back on bad input", () => {
    const params = new URLSearchParams("s=lace&d=nope&n=7&z=99&t=9-9&wp=zzz.3&wf=&v=x");
    expect(parseWeavingState(params)).toEqual(defaultWeavingState());
    expect(parseWeavingState(params, "es")).toEqual(defaultWeavingState("es"));
  });

  it("keeps a structure's settings within what it offers", () => {
    expect(parseWeavingState(new URLSearchParams("s=plain&n=16&t=8-8&z=3"))).toMatchObject({ structure: "plain", shafts: 4, tieUp: "standard", size: 1 });
    expect(parseWeavingState(new URLSearchParams("s=satin"))).toMatchObject({ shafts: 5, tieUp: "1/4" });
    // A draft belongs to one structure; on another structure's page it's dropped.
    expect(parseWeavingState(new URLSearchParams("s=twill&d=monks-belt")).draft).toBeUndefined();
    for (const structure of STRUCTURE_OPTIONS) {
      for (const shafts of shaftOptions(structure)) {
        for (const tieUp of tieUpOptions(structure, shafts)) {
          const state = normalizeWeaving({ ...defaultWeavingState(), structure, shafts, tieUp, size: STRUCTURES[structure].sizes.at(-1)! });
          expect(parseWeavingState(new URLSearchParams(serializeWeavingState(state)))).toEqual(state);
        }
      }
    }
  });

  it("keeps its two primary colors in every language", () => {
    const colors = LOCALES.map((l) => JSON.stringify([defaultWeavingState(l).warp, defaultWeavingState(l).weft]));
    expect(new Set(colors).size).toBe(1);
  });

  it("sends the API everything but the view", () => {
    expect(weavingRequest(defaultWeavingState())).not.toHaveProperty("view");
  });
});

describe("traditional drafts", () => {
  it("offers at least 25, each named in every language and valid for its structure", () => {
    expect(WEAVING_PRESETS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(WEAVING_PRESETS.map((p) => p.id)).size).toBe(WEAVING_PRESETS.length);
    for (const preset of WEAVING_PRESETS) {
      expect(STRUCTURE_OPTIONS).not.toContain(preset.id);
      const state = presetState(preset);
      // Nothing in a preset is dropped or corrected on the way in.
      const patch: Partial<typeof preset> = { ...preset };
      delete patch.id;
      expect(state).toMatchObject(patch);
      if (preset.draft) expect(NAMED_DRAFTS[preset.draft]).toBe(preset.structure);
      expect(parseWeavingState(new URLSearchParams(serializeWeavingState(state)))).toEqual(state);
    }
    for (const locale of LOCALES) {
      const names = WEAVING_PRESETS.map((p) => (copy[locale].drafts as Record<string, string>)[p.id]);
      expect(names.every(Boolean), locale).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("links each to its structure's page with its own settings", () => {
    const links = weavingDraftLinks("fr");
    expect(links.find((l) => l.id === "monks-belt")!.href).toBe("/fr/weaving/overshot/?d=monks-belt&wp=f4ecdc.1&wf=a31621.1");
    expect(links.find((l) => l.id === "birds-eye")!.href).toBe("/fr/weaving/point-twill/?z=1");
    for (const link of links) expect(link.src).toContain(`/weaving/${link.id}`);
  });
});

describe("translations", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flatten = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => flatten(v, path ? `${path}.${k}` : k));

  it.each(LOCALES)("%s has every key with the same placeholders", (locale) => {
    const english = flatten(copy.en);
    const theirs = new Map(flatten(copy[locale]));
    expect([...theirs.keys()].sort()).toEqual(english.map(([k]) => k).sort());
    for (const [k, text] of english) {
      expect(theirs.get(k), k).toBeTruthy();
      expect(placeholders(theirs.get(k)!), k).toEqual(placeholders(text));
    }
  });

  it("covers every structure", () => {
    for (const locale of LOCALES) for (const structure of STRUCTURE_OPTIONS) expect(copy[locale].structureHelp[structure]).toBeTruthy();
  });
});
