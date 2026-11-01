import type { Locale, StainedGlassLayout, StainedGlassRequest } from "./generator";
import { localeAccent } from "./localeAccent";

/** The stained glass builder's options, palettes and share links. */

export const GLASS_LAYOUTS: StainedGlassLayout[] = ["rose", "quarries", "medallion", "sunburst", "honeycomb", "pinwheels"];
export const GLASS_SIDES = Array.from({ length: 15 }, (_, i) => 8 + i * 2);
export const GLASS_DETAILS = [1, 2, 3];
/** Came is sold in fractions: face widths from 3/16" to 1/2". */
export const CAME_WIDTHS = [0.1875, 0.25, 0.375, 0.5];
/** Hearts from a copper foil gap of 1/32" to a heavy 3/32". */
export const HEART_WIDTHS = [0.03125, 0.046875, 0.0625, 0.078125, 0.09375];

export type GlassPaletteId = "cathedral" | "amber" | "sea" | "garden";

/** Invented for this site. Four glasses: center, first, second and background. */
export const GLASS_PALETTES: { id: GlassPaletteId; colors: string[] }[] = [
  { id: "cathedral", colors: ["#e8b92f", "#b02a37", "#2a5d9c", "#dfe9e4"] },
  { id: "amber", colors: ["#c8451b", "#e39a2d", "#f1cf76", "#f6ecd2"] },
  { id: "sea", colors: ["#f0d67a", "#14607a", "#3aa0a8", "#d5ecea"] },
  { id: "garden", colors: ["#d9486b", "#2f7a46", "#8cb84f", "#f0efd8"] },
];

export function defaultStainedGlassState(locale: Locale = "en"): StainedGlassRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    layout: "rose",
    width: 18,
    height: 18,
    detail: 2,
    cameWidth: 0.25,
    heartWidth: 0.0625,
    colors: GLASS_PALETTES[0].colors.map((color, i) => (i === 2 ? localeAccent(locale, color) : color)),
  };
}

const encodeColors = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");

function decodeColors(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length !== 4 || !parts.every((hex) => /^[0-9a-f]{6}$/i.test(hex))) return null;
  return parts.map((hex) => `#${hex.toLowerCase()}`);
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function parseStainedGlassState(params: { get(name: string): string | null }, locale: Locale = "en"): StainedGlassRequest {
  const base = defaultStainedGlassState(locale);
  const layout = params.get("l") as StainedGlassLayout | null;
  return {
    ...(locale === "en" ? {} : { locale }),
    layout: layout && GLASS_LAYOUTS.includes(layout) ? layout : base.layout,
    width: pick(params.get("w"), GLASS_SIDES, base.width),
    height: pick(params.get("h"), GLASS_SIDES, base.height),
    detail: pick(params.get("d"), GLASS_DETAILS, base.detail),
    cameWidth: pick(params.get("came"), CAME_WIDTHS, base.cameWidth),
    heartWidth: pick(params.get("heart"), HEART_WIDTHS, base.heartWidth),
    colors: decodeColors(params.get("c")) ?? base.colors,
  };
}

export function serializeStainedGlassState(state: StainedGlassRequest): string {
  const base = defaultStainedGlassState(state.locale);
  const params = new URLSearchParams();
  if (state.layout !== base.layout) params.set("l", state.layout);
  if (state.width !== base.width) params.set("w", String(state.width));
  if (state.height !== base.height) params.set("h", String(state.height));
  if (state.detail !== base.detail) params.set("d", String(state.detail));
  if (state.cameWidth !== base.cameWidth) params.set("came", String(state.cameWidth));
  if (state.heartWidth !== base.heartWidth) params.set("heart", String(state.heartWidth));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("c", encodeColors(state.colors));
  return params.toString();
}
