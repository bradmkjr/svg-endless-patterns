import { describe, expect, it } from "vitest";
import apiStatus from "../i18n/messages/apiStatus.json";
import celticKnot from "../i18n/messages/celticKnot.json";
import girih from "../i18n/messages/girih.json";
import mandala from "../i18n/messages/mandala.json";
import sashiko from "../i18n/messages/sashiko.json";
import stainedGlass from "../i18n/messages/stainedGlass.json";
import tessellation from "../i18n/messages/tessellation.json";
import tieDye from "../i18n/messages/tieDye.json";
import truchet from "../i18n/messages/truchet.json";
import kolam from "../i18n/messages/kolam.json";
import waves from "../i18n/messages/waves.json";
import nature from "../i18n/messages/nature.json";
import weaving from "../i18n/messages/weaving.json";
import crossStitch from "../i18n/messages/crossStitch.json";
import needlepoint from "../i18n/messages/needlepoint.json";
import quilt from "../i18n/messages/quilt.json";
import favorites from "../i18n/messages/favorites.json";
import colorPicker from "../i18n/messages/colorPicker.json";
import seasonal from "../i18n/messages/seasonal.json";
import origami from "../i18n/messages/origami.json";
import origamiTessellation from "../i18n/messages/origamiTessellation.json";
import { SEASONS } from "./seasons";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;
const leaves = (value: unknown, path = ""): [string, string][] =>
  typeof value === "string" ? [[path, value]] : Object.entries((value ?? {}) as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

/** Generated text moved to the API with its tests; the site's own text stays checked here. */
describe.each(Object.entries({ origami, origamiTessellation, apiStatus, celticKnot, girih, mandala, sashiko, stainedGlass, tessellation, tieDye, truchet, kolam, waves, nature, weaving, crossStitch, needlepoint, quilt, favorites, colorPicker, seasonal }))("%s site text", (_, copy) => {
  it.each(LOCALES)("%s matches English", (locale) => {
    const english = Object.fromEntries(leaves(copy.en));
    const here = Object.fromEntries(leaves(copy[locale]));
    expect(Object.keys(here).filter((k) => !k.startsWith("options.")).sort()).toEqual(Object.keys(english).filter((k) => !k.startsWith("options.")).sort());
    for (const [key, text] of Object.entries(here)) {
      expect(text.trim(), key).not.toBe("");
      if (!key.startsWith("options.")) expect(holes(text), key).toEqual(holes(english[key]));
    }
  });
});

describe("site text", () => {
  it("names no thread or yarn maker", () => {
    expect(JSON.stringify([crossStitch, needlepoint])).not.toMatch(/\b(DMC|Anchor|Madeira|Cosmo|Appleton|Paternayan)\b/i);
  });
});

describe("seasonal text", () => {
  it.each(SEASONS)("names every group and captions every sample of $id", (season) => {
    const text = seasonal.en.seasons[season.id];
    expect(Object.keys(text.groups).sort()).toEqual(season.groups.map((g) => g.id).sort());
    const ids = season.groups.flatMap((g) => g.samples.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(text.samples).sort()).toEqual([...ids].sort());
    for (const id of season.featured) expect(ids).toContain(id);
  });
});
