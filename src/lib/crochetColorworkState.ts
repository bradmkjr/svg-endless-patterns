import copy from "@/i18n/messages/crochetColorwork.json";
import type { ColorworkTechnique, ColorworkWeight, CrochetColorworkRequest, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The crochet colorwork builder's options, defaults and share links. */

/** What the pages need to know about each design. Its chart lives with generation; a test keeps the two in step. */
export type ColorworkDesign = { id: string; technique: ColorworkTechnique; colors: number };
export const COLORWORK_DESIGNS: ColorworkDesign[] = [
  { id: "diamond-lattice", technique: "tapestry", colors: 2 },
  { id: "stepped-cross", technique: "tapestry", colors: 3 },
  { id: "nested-chevrons", technique: "tapestry", colors: 4 },
  { id: "heart", technique: "c2c", colors: 3 },
  { id: "sunburst", technique: "c2c", colors: 3 },
  { id: "ripple-diamond", technique: "c2c", colors: 4 },
  { id: "frost", technique: "granny", colors: 2 },
  { id: "meadow", technique: "granny", colors: 4 },
  { id: "ember", technique: "granny", colors: 3 },
];
export const COLORWORK_DESIGN_IDS = COLORWORK_DESIGNS.map((d) => d.id);
export const COLORWORK_WEIGHT_OPTIONS: ColorworkWeight[] = ["sport", "dk", "worsted", "bulky"];
export const COLORWORK_REPEAT_OPTIONS = [1, 2, 3];

const MAIN = "#f6efe0";
/** The first contrast is the secondary color a language may change. */
const CONTRAST = ["#b4412f", "#2f6f73", "#d9a441"];

const HEX = /^[0-9a-f]{6}$/i;

const designOf = (id: string): ColorworkDesign => COLORWORK_DESIGNS.find((d) => d.id === id) ?? COLORWORK_DESIGNS[0];

function defaultContrast(design: ColorworkDesign, locale: Locale): string[] {
  return CONTRAST.slice(0, design.colors - 1).map((color, i) => (i === 0 ? localeAccent(locale, color) : color));
}

/** A design with its settings, ready for the generator. */
function requestFor(design: ColorworkDesign, locale: Locale): CrochetColorworkRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    design: design.id,
    name: copy[locale].designs[design.id as keyof (typeof copy)["en"]["designs"]],
    color: MAIN,
    contrast: defaultContrast(design, locale),
    weight: "worsted",
    repeats: 1,
  };
}

export function defaultCrochetColorworkState(locale: Locale = "en", design = COLORWORK_DESIGNS[0].id): CrochetColorworkRequest {
  return requestFor(designOf(design), locale);
}

/**
 * `cc` must be all hex, or the design's colors stand. A link from a design with more colors
 * keeps those it needs, and one with fewer is filled from the defaults.
 */
function decodeContrast(raw: string | null, fallback: string[]): string[] {
  if (!raw) return fallback;
  const parts = raw.split("-");
  if (parts.length > CONTRAST.length || !parts.every((part) => HEX.test(part))) return fallback;
  return fallback.map((color, i) => (parts[i] ? `#${parts[i].toLowerCase()}` : color));
}

export function parseCrochetColorworkState(params: { get(name: string): string | null }, locale: Locale = "en"): CrochetColorworkRequest {
  const design = COLORWORK_DESIGN_IDS.find((id) => id === params.get("d")) ?? COLORWORK_DESIGN_IDS[0];
  const base = defaultCrochetColorworkState(locale, design);
  const color = params.get("c");
  const repeats = Number(params.get("r"));
  return {
    ...base,
    color: color && HEX.test(color) ? `#${color.toLowerCase()}` : base.color,
    contrast: decodeContrast(params.get("cc"), base.contrast ?? []),
    weight: COLORWORK_WEIGHT_OPTIONS.find((w) => w === params.get("w")) ?? base.weight,
    repeats: COLORWORK_REPEAT_OPTIONS.includes(repeats) ? repeats : base.repeats,
  };
}

const encode = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");

export function serializeCrochetColorworkState(state: CrochetColorworkRequest): string {
  const base = defaultCrochetColorworkState(state.locale, state.design);
  const params = new URLSearchParams();
  if (state.design !== COLORWORK_DESIGN_IDS[0]) params.set("d", state.design);
  if (state.color !== base.color) params.set("c", state.color.slice(1));
  const contrast = encode(state.contrast ?? []);
  if (contrast !== encode(base.contrast ?? [])) params.set("cc", contrast);
  if (state.weight !== base.weight) params.set("w", state.weight);
  if (state.repeats !== base.repeats) params.set("r", String(state.repeats));
  return params.toString();
}
