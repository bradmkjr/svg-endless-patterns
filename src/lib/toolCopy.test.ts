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
import crossStitch from "../i18n/messages/crossStitch.json";
import needlepoint from "../i18n/messages/needlepoint.json";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const leaves = (value: unknown, path = ""): [string, string][] =>
  typeof value === "string" ? [[path, value]] : Object.entries((value ?? {}) as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

/** Generated text moved to the API with its tests; the site's own text stays checked here. */
describe.each(Object.entries({ apiStatus, celticKnot, girih, mandala, sashiko, stainedGlass, tessellation, tieDye, truchet, crossStitch, needlepoint }))("%s site text", (_, copy) => {
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
