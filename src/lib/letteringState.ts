import copy from "@/i18n/messages/lettering.json";
import type { ColorworkWeight, LetteringAlign, LetteringFont, LetteringLayout, LetteringRequest, LetteringTechnique, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The lettering builder's options, defaults, phrases to try and share links. */

export const TECHNIQUE_OPTIONS: LetteringTechnique[] = ["tapestry", "c2c", "quilt"];
/** Each technique's page: `/lettering/c2c-crochet/`. */
export const TECHNIQUE_SLUGS: Record<LetteringTechnique, string> = { tapestry: "tapestry-crochet", c2c: "c2c-crochet", quilt: "quilt" };
export const FONT_OPTIONS: LetteringFont[] = ["rounded", "thin", "slab", "serif", "script", "decorative", "pixel"];
export const LAYOUT_OPTIONS: LetteringLayout[] = ["panel", "square", "squares"];
export const ALIGN_OPTIONS: LetteringAlign[] = ["center", "left", "right"];
export const WEIGHT_OPTIONS: ColorworkWeight[] = ["sport", "dk", "worsted", "bulky"];
/** A quilt's finished square, in inches. The API checks the same list. */
export const SQUARE_OPTIONS = [1, 1.5, 2, 2.5, 3];
export const HEIGHT_RANGE = { min: 5, max: 60 };
export const SPACING_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
export const LINE_GAP_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12];
export const MARGIN_RANGE = { min: 0, max: 40 };
export const BORDER_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
/** As the API counts them: lines are separate, and blank ones don't count. */
export const MESSAGE_LIMITS = { characters: 80, lines: 5 };
/** Fonts whose thin strokes need room: below this many rows, a note suggests going larger. */
export const FINE_FONTS: Partial<Record<LetteringFont, number>> = { serif: 12, script: 12, decorative: 20, thin: 10 };

/** Ground and letters are the primary colors; the border is the secondary a language may change. */
const GROUND = "#f6efe0";
const LETTERS = "#23395d";
const BORDER = "#b5533c";
const HEX = /^[0-9a-f]{6}$/i;

const DEFAULTS = { font: "rounded" as LetteringFont, height: 12, layout: "panel" as LetteringLayout, margin: 3, border: 1, weight: "worsted" as ColorworkWeight, square: 2 };

export function defaultLetteringState(locale: Locale = "en", technique: LetteringTechnique = "tapestry"): LetteringRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    message: copy[locale].defaultMessage,
    font: DEFAULTS.font,
    height: DEFAULTS.height,
    layout: DEFAULTS.layout,
    margin: DEFAULTS.margin,
    border: DEFAULTS.border,
    colors: [GROUND, LETTERS, localeAccent(locale, BORDER)],
    technique,
    weight: DEFAULTS.weight,
    square: DEFAULTS.square,
  };
}

/**
 * Settings a preset phrase brings with it, and smaller ones for a quilt, whose squares are inches
 * rather than stitches. The words come from the language's own messages. Every preset fits every
 * technique in every language: the test checks the sizes against the API's limits.
 */
export type LetteringPreset = { id: keyof (typeof copy)["en"]["presets"]; settings: Partial<LetteringRequest>; quilt: Partial<LetteringRequest> };
export const PRESETS: LetteringPreset[] = [
  { id: "initial", settings: { font: "decorative", height: 30, layout: "square", margin: 4, border: 1 }, quilt: { height: 16, margin: 2 } },
  { id: "name", settings: { font: "script", height: 16, layout: "panel", margin: 3, border: 1 }, quilt: { height: 10, margin: 2 } },
  { id: "alphabet", settings: { font: "rounded", height: 14, layout: "squares", margin: 3, border: 1 }, quilt: { height: 8, margin: 2 } },
  { id: "baby", settings: { font: "rounded", height: 12, height2: 10, layout: "panel", margin: 4, border: 2 }, quilt: { font: "pixel", height: 7, height2: 7, margin: 2, border: 1, square: 1 } },
  { id: "wedding", settings: { font: "serif", height: 12, height2: 9, layout: "panel", margin: 4, border: 1 }, quilt: { font: "pixel", height: 7, height2: 7, margin: 2, square: 1 } },
  { id: "family", settings: { font: "pixel", height: 14, height2: 7, layout: "panel", margin: 3, border: 1 }, quilt: { height: 7, height2: 7, margin: 2, square: 1 } },
  { id: "love", settings: { font: "slab", height: 12, layout: "square", margin: 3, border: 1 }, quilt: { height: 8, margin: 2 } },
];

/** A preset applied to the current settings: its words and type, keeping the technique, colors and yarn. */
export function withPreset(state: LetteringRequest, preset: LetteringPreset, locale: Locale): LetteringRequest {
  const { height2, spacing, lineGap, align, ...rest } = state;
  void [height2, spacing, lineGap, align];
  return { ...rest, ...preset.settings, ...(state.technique === "quilt" ? preset.quilt : {}), message: copy[locale].presets[preset.id].text };
}

const int = (raw: string | null, min: number, max: number): number | undefined => {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return undefined;
  const n = Number(raw);
  return n >= min && n <= max ? n : undefined;
};

function decodeColors(raw: string | null, fallback: [string, string, string]): [string, string, string] {
  if (!raw) return fallback;
  const parts = raw.split("-");
  if (parts.length !== 3 || !parts.every((part) => HEX.test(part))) return fallback;
  return parts.map((part) => `#${part.toLowerCase()}`) as [string, string, string];
}

export function parseLetteringState(params: { get(name: string): string | null }, locale: Locale = "en"): LetteringRequest {
  const technique = TECHNIQUE_OPTIONS.find((t) => t === params.get("t")) ?? TECHNIQUE_OPTIONS[0];
  const base = defaultLetteringState(locale, technique);
  const message = params.get("m");
  const height = int(params.get("h"), HEIGHT_RANGE.min, HEIGHT_RANGE.max) ?? base.height;
  const height2 = int(params.get("h2"), HEIGHT_RANGE.min, HEIGHT_RANGE.max);
  const spacing = int(params.get("s"), 0, SPACING_OPTIONS[SPACING_OPTIONS.length - 1]);
  const lineGap = int(params.get("g"), 0, LINE_GAP_OPTIONS[LINE_GAP_OPTIONS.length - 1]);
  const align = ALIGN_OPTIONS.find((a) => a === params.get("a"));
  const square = Number(params.get("q"));
  return {
    ...base,
    message: message && message.trim() ? message.slice(0, 200) : base.message,
    font: FONT_OPTIONS.find((f) => f === params.get("f")) ?? base.font,
    height,
    ...(height2 !== undefined && height2 !== height ? { height2 } : {}),
    layout: LAYOUT_OPTIONS.find((l) => l === params.get("l")) ?? base.layout,
    ...(align && align !== "center" ? { align } : {}),
    ...(spacing !== undefined ? { spacing } : {}),
    ...(lineGap !== undefined ? { lineGap } : {}),
    margin: int(params.get("mg"), MARGIN_RANGE.min, MARGIN_RANGE.max) ?? base.margin,
    border: int(params.get("b"), 0, BORDER_OPTIONS[BORDER_OPTIONS.length - 1]) ?? base.border,
    colors: decodeColors(params.get("c"), base.colors),
    weight: WEIGHT_OPTIONS.find((w) => w === params.get("w")) ?? base.weight,
    square: SQUARE_OPTIONS.includes(square) ? square : base.square,
  };
}

export function serializeLetteringState(state: LetteringRequest): string {
  const base = defaultLetteringState(state.locale, state.technique);
  const params = new URLSearchParams();
  if (state.technique !== TECHNIQUE_OPTIONS[0]) params.set("t", state.technique);
  if (state.message !== base.message) params.set("m", state.message);
  if (state.font !== base.font) params.set("f", state.font);
  if (state.height !== base.height) params.set("h", String(state.height));
  if (state.height2 !== undefined && state.height2 !== state.height) params.set("h2", String(state.height2));
  if (state.layout !== base.layout) params.set("l", state.layout);
  if (state.align && state.align !== "center") params.set("a", state.align);
  if (state.spacing !== undefined) params.set("s", String(state.spacing));
  if (state.lineGap !== undefined) params.set("g", String(state.lineGap));
  if (state.margin !== base.margin) params.set("mg", String(state.margin));
  if (state.border !== base.border) params.set("b", String(state.border));
  const colors = state.colors.map((c) => c.slice(1)).join("-");
  if (colors !== base.colors.map((c) => c.slice(1)).join("-")) params.set("c", colors);
  if (state.weight && state.weight !== base.weight) params.set("w", state.weight);
  if (state.square !== undefined && state.square !== base.square) params.set("q", String(state.square));
  return params.toString();
}

/** What's sent to the API: only the settings the technique uses, so the same chart is one cached answer. */
export function letteringRequest(state: LetteringRequest): LetteringRequest {
  const { weight, square, ...rest } = state;
  return state.technique === "quilt" ? { ...rest, square: square ?? DEFAULTS.square } : { ...rest, weight: weight ?? DEFAULTS.weight };
}

/** Lines and characters as the API counts them, for the counter under the box. */
export function messageCounts(message: string): { lines: number; characters: number } {
  const lines = message.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  return { lines: lines.length, characters: lines.join("").length };
}
