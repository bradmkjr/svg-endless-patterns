import copy from "@/i18n/messages/knitColorwork.json";
import type { KnitColorworkRequest, KnitColorworkTechnique, Locale } from "./generator";
import { KNIT_COLORWORK_OPTIONS } from "./knitColorworkOptions";
import { localeAccent } from "./localeAccent";

/** The knit colorwork builder's options, defaults and share links. */

export const KNIT_COLORWORK_SIZES = [6, 8, 10, 12];
const DEFAULT_KNIT_COLORWORK_SIZE = 8;
export const STITCH_GAUGE_OPTIONS = Array.from({ length: 21 }, (_, i) => i + 14);
export const ROW_GAUGE_OPTIONS = Array.from({ length: 41 }, (_, i) => i + 16);
export const DESIGN_IDS = KNIT_COLORWORK_OPTIONS.map((design) => design.id);

type Option = (typeof KNIT_COLORWORK_OPTIONS)[number];

const STARTING_GAUGE: Record<KnitColorworkTechnique, [number, number]> = { stranded: [24, 28], mosaic: [20, 40], intarsia: [20, 26] };
const MAIN = "#f4ecd8";
const FIRST_CONTRAST = "#23395d";
/** The one secondary color a language changes. */
const SECOND_CONTRAST = "#b3403a";
const THIRD_CONTRAST = "#2f8f9d";
const HEX = /^[0-9a-f]{6}$/i;

const optionById = (id: string | null) => KNIT_COLORWORK_OPTIONS.find((option) => option.id === id);

function defaultContrast(option: Option, locale: Locale): string[] {
  return [FIRST_CONTRAST, localeAccent(locale, SECOND_CONTRAST), THIRD_CONTRAST].slice(0, option.contrasts);
}

function requestFor(option: Option, locale: Locale): KnitColorworkRequest {
  const [stitchGauge, rowGauge] = STARTING_GAUGE[option.technique];
  return {
    ...(locale === "en" ? {} : { locale }),
    design: option.id,
    name: copy[locale].designs[option.id as keyof (typeof copy)["en"]["designs"]],
    squareSize: DEFAULT_KNIT_COLORWORK_SIZE,
    stitchGauge,
    rowGauge,
    color: MAIN,
    contrast: defaultContrast(option, locale),
  };
}

export function defaultKnitColorworkState(locale: Locale = "en"): KnitColorworkRequest {
  return requestFor(KNIT_COLORWORK_OPTIONS[0], locale);
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

/** Contrasts from a link, only if there's a valid color for each one the design uses. */
function decodeContrast(raw: string | null, count: number): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length !== count || !parts.every((part) => HEX.test(part))) return null;
  return parts.map((part) => `#${part.toLowerCase()}`);
}

export function parseKnitColorworkState(params: { get(name: string): string | null }, locale: Locale = "en"): KnitColorworkRequest {
  const option = optionById(params.get("d")) ?? KNIT_COLORWORK_OPTIONS[0];
  const base = requestFor(option, locale);
  const color = params.get("c");
  return {
    ...base,
    squareSize: pick(params.get("sq"), KNIT_COLORWORK_SIZES, base.squareSize),
    stitchGauge: pick(params.get("sg"), STITCH_GAUGE_OPTIONS, base.stitchGauge),
    rowGauge: pick(params.get("rg"), ROW_GAUGE_OPTIONS, base.rowGauge),
    color: color && HEX.test(color) ? `#${color.toLowerCase()}` : base.color,
    contrast: decodeContrast(params.get("cc"), option.contrasts) ?? base.contrast,
  };
}

const encodeContrast = (contrast: string[] | undefined) => (contrast ?? []).map((c) => c.slice(1)).join("-");

export function serializeKnitColorworkState(state: KnitColorworkRequest): string {
  const base = requestFor(optionById(state.design) ?? KNIT_COLORWORK_OPTIONS[0], state.locale ?? "en");
  const params = new URLSearchParams();
  if (state.design !== KNIT_COLORWORK_OPTIONS[0].id) params.set("d", state.design);
  if (state.squareSize !== base.squareSize) params.set("sq", String(state.squareSize));
  if (state.stitchGauge !== base.stitchGauge) params.set("sg", String(state.stitchGauge));
  if (state.rowGauge !== base.rowGauge) params.set("rg", String(state.rowGauge));
  if (state.color !== base.color) params.set("c", state.color.slice(1));
  if (encodeContrast(state.contrast) !== encodeContrast(base.contrast)) params.set("cc", encodeContrast(state.contrast));
  return params.toString();
}
