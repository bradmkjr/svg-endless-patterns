import type { Locale, NatureColors, NatureLayout, NatureMotif, NaturePacking, NatureRequest, NatureStyle } from "./generator";
import { localeAccent } from "./localeAccent";

/** The nature pattern builder's options, default colors and share links. */

export const MOTIF_OPTIONS: NatureMotif[] = ["leaves", "flowers", "clouds", "rocks", "ferns", "grass"];
export const LAYOUT_OPTIONS: NatureLayout[] = ["scatter", "grid"];
export const PACKING_OPTIONS: NaturePacking[] = ["spaced", "touching", "overlapping"];
export const STYLE_OPTIONS: NatureStyle[] = ["filled", "outline"];
export const DENSITY_OPTIONS = [1, 2, 3, 4, 5];
export const SCALE_OPTIONS = [25, 35, 50, 75, 100, 150, 200, 250, 300];
export const VARIATION_OPTIONS = [0, 10, 25, 40, 60, 75, 90];
export const ROTATION_OPTIONS = [0, 15, 30, 60, 90, 180];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 7.5];
export const MAX_SEED = 999999;

/** Each motif opens in its own colors, and upright or turned as suits it. The accent is the color a language changes. */
const MOTIF_DEFAULTS: Record<NatureMotif, { colors: NatureColors; rotation: number }> = {
  leaves: { colors: { background: "#f4efe3", primary: "#2f5d3a", secondary: "#7f9a52", accent: "#c8553d" }, rotation: 180 },
  flowers: { colors: { background: "#fbf5ee", primary: "#b8456b", secondary: "#6f8fbf", accent: "#e8b33c" }, rotation: 180 },
  clouds: { colors: { background: "#8fb8d8", primary: "#ffffff", secondary: "#dcebf6", accent: "#f6d7a7" }, rotation: 0 },
  rocks: { colors: { background: "#ece6da", primary: "#6b625a", secondary: "#a39686", accent: "#c2a27a" }, rotation: 180 },
  ferns: { colors: { background: "#f1f0e4", primary: "#2e5e3e", secondary: "#5f8f4e", accent: "#a3b86c" }, rotation: 30 },
  grass: { colors: { background: "#f3f0dc", primary: "#4f7a2f", secondary: "#86a93f", accent: "#c9b458" }, rotation: 15 },
};

export function defaultNatureState(locale: Locale = "en", motif: NatureMotif = "leaves"): NatureRequest {
  const { colors, rotation } = MOTIF_DEFAULTS[motif];
  return {
    ...(locale === "en" ? {} : { locale }),
    motif,
    layout: "scatter",
    packing: "touching",
    style: "filled",
    density: 3,
    scale: 100,
    variation: 25,
    rotation,
    seed: 7,
    colors: { ...colors, accent: localeAccent(locale, colors.accent) },
    repeatWidth: 4,
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);
const decodeSeed = (raw: string | null, fallback: number) => (raw && /^\d{1,6}$/.test(raw) ? Number(raw) : fallback);

export function parseNatureState(params: { get(name: string): string | null }, locale: Locale = "en"): NatureRequest {
  const motif = pick(params.get("m"), MOTIF_OPTIONS, "leaves", (raw) => raw as NatureMotif);
  const base = defaultNatureState(locale, motif);
  return {
    ...(locale === "en" ? {} : { locale }),
    motif,
    layout: pick(params.get("l"), LAYOUT_OPTIONS, base.layout, (raw) => raw as NatureLayout),
    packing: pick(params.get("p"), PACKING_OPTIONS, base.packing, (raw) => raw as NaturePacking),
    style: pick(params.get("st"), STYLE_OPTIONS, base.style, (raw) => raw as NatureStyle),
    density: pick(params.get("d"), DENSITY_OPTIONS, base.density, Number),
    scale: pick(params.get("sc"), SCALE_OPTIONS, base.scale, Number),
    variation: pick(params.get("v"), VARIATION_OPTIONS, base.variation, Number),
    rotation: pick(params.get("rot"), ROTATION_OPTIONS, base.rotation, Number),
    seed: decodeSeed(params.get("seed"), base.seed),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      primary: decodeColor(params.get("pr"), base.colors.primary),
      secondary: decodeColor(params.get("se"), base.colors.secondary),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
    repeatWidth: pick(params.get("r"), REPEAT_OPTIONS, base.repeatWidth, Number),
  };
}

/** Settings that differ from the motif's own defaults. Seeds stay out of links; see `storedSeed`. */
export function serializeNatureState(state: NatureRequest): string {
  const base = defaultNatureState(state.locale, state.motif);
  const params = new URLSearchParams();
  if (state.motif !== "leaves") params.set("m", state.motif);
  if (state.layout !== base.layout) params.set("l", state.layout);
  if (state.packing !== base.packing) params.set("p", state.packing);
  if (state.style !== base.style) params.set("st", state.style);
  if (state.density !== base.density) params.set("d", String(state.density));
  if (state.scale !== base.scale) params.set("sc", String(state.scale));
  if (state.variation !== base.variation) params.set("v", String(state.variation));
  if (state.rotation !== base.rotation) params.set("rot", String(state.rotation));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("pr", state.colors.primary.slice(1));
  if (state.colors.secondary !== base.colors.secondary) params.set("se", state.colors.secondary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("r", String(state.repeatWidth));
  return params.toString();
}
