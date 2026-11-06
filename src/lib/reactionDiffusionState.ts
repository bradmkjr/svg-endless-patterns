import type { Locale, RdColors, RdDirection, RdPreset, RdRequest, RdStyle } from "./generator";
import { localeAccent } from "./localeAccent";

/** The Turing pattern builder's options, default colors and share links. */

export const PRESET_OPTIONS: RdPreset[] = ["spots", "mitosis", "coral", "labyrinth", "stripes", "worms", "holes", "bubbles"];
export const DIRECTION_OPTIONS: RdDirection[] = ["none", "horizontal", "vertical", "rising", "falling"];
export const STYLE_OPTIONS: RdStyle[] = ["filled", "outline", "bands"];
export const SCALE_OPTIONS = [64, 96, 128, 160];
export const ITERATION_OPTIONS = [1000, 2000, 3000, 4000, 6000];
export const THRESHOLD_OPTIONS = [20, 30, 40, 50, 60, 70, 80];
export const WEIGHT_OPTIONS = [1, 2, 3, 4];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 7.5];
export const MAX_SEED = 999999;

const COLORS: RdColors = { background: "#f7f3ea", primary: "#1f3a5f", accent: "#c8553d" };

export function defaultRdState(locale: Locale = "en"): RdRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    preset: "coral",
    seed: 7,
    scale: 128,
    iterations: 4000,
    threshold: 50,
    direction: "none",
    style: "filled",
    weight: 2,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
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

export function parseRdState(params: { get(name: string): string | null }, locale: Locale = "en"): RdRequest {
  const base = defaultRdState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    preset: pick(params.get("p"), PRESET_OPTIONS, base.preset, (raw) => raw as RdPreset),
    seed: decodeSeed(params.get("seed"), base.seed),
    scale: pick(params.get("s"), SCALE_OPTIONS, base.scale, Number),
    iterations: pick(params.get("it"), ITERATION_OPTIONS, base.iterations, Number),
    threshold: pick(params.get("t"), THRESHOLD_OPTIONS, base.threshold, Number),
    direction: pick(params.get("d"), DIRECTION_OPTIONS, base.direction, (raw) => raw as RdDirection),
    style: pick(params.get("st"), STYLE_OPTIONS, base.style, (raw) => raw as RdStyle),
    weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight, Number),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      primary: decodeColor(params.get("fg"), base.colors.primary),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
    repeatWidth: pick(params.get("r"), REPEAT_OPTIONS, base.repeatWidth, Number),
  };
}

/** The seed stays out of the link, as every tool's does; the builder remembers it instead. */
export function serializeRdState(state: RdRequest): string {
  const base = defaultRdState(state.locale);
  const params = new URLSearchParams();
  if (state.preset !== base.preset) params.set("p", state.preset);
  if (state.scale !== base.scale) params.set("s", String(state.scale));
  if (state.iterations !== base.iterations) params.set("it", String(state.iterations));
  if (state.threshold !== base.threshold) params.set("t", String(state.threshold));
  if (state.direction !== base.direction) params.set("d", state.direction);
  if (state.style !== base.style) params.set("st", state.style);
  if (state.weight !== base.weight) params.set("w", String(state.weight));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("fg", state.colors.primary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("r", String(state.repeatWidth));
  return params.toString();
}
