import type { Locale, TruchetArrangement, TruchetColors, TruchetRequest, TruchetStyle } from "./generator";

/** The Truchet builder's options, default colors and share links. */

export const STYLE_OPTIONS: TruchetStyle[] = ["arcs", "chamfers", "diagonals", "triangles"];
export const ARRANGEMENT_OPTIONS: TruchetArrangement[] = ["random", "mirror", "checker", "stripes", "waves"];
export const GRID_OPTIONS = [4, 6, 8, 10, 12, 16, 20, 24];
export const WEIGHT_OPTIONS = [4, 6, 8, 10, 12, 16, 20, 24, 30];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 7.5];
export const MAX_SEED = 999999;

const COLORS: Record<Locale, TruchetColors> = {
  en: { background: "#f7f3ea", line: "#1f3a5f", accent: "#c8553d" },
  es: { background: "#fbf4e4", line: "#aa151b", accent: "#d99a00" },
  fr: { background: "#f6f5f1", line: "#0055a4", accent: "#ef4135" },
  de: { background: "#f6d55c", line: "#1f1f1f", accent: "#d00000" },
  pt: { background: "#fff3b0", line: "#009b3a", accent: "#002776" },
};

export function defaultTruchetState(locale: Locale = "en"): TruchetRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    style: "arcs",
    arrangement: "random",
    grid: 8,
    weight: 12,
    seed: 7,
    colors: COLORS[locale],
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

export function parseTruchetState(params: { get(name: string): string | null }, locale: Locale = "en"): TruchetRequest {
  const base = defaultTruchetState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    style: pick(params.get("style"), STYLE_OPTIONS, base.style, (raw) => raw as TruchetStyle),
    arrangement: pick(params.get("a"), ARRANGEMENT_OPTIONS, base.arrangement, (raw) => raw as TruchetArrangement),
    grid: pick(params.get("g"), GRID_OPTIONS, base.grid, Number),
    weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight, Number),
    seed: decodeSeed(params.get("seed"), base.seed),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      line: decodeColor(params.get("ln"), base.colors.line),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
    repeatWidth: pick(params.get("r"), REPEAT_OPTIONS, base.repeatWidth, Number),
  };
}

export function serializeTruchetState(state: TruchetRequest): string {
  const base = defaultTruchetState(state.locale);
  const params = new URLSearchParams();
  if (state.style !== base.style) params.set("style", state.style);
  if (state.arrangement !== base.arrangement) params.set("a", state.arrangement);
  if (state.grid !== base.grid) params.set("g", String(state.grid));
  if (state.weight !== base.weight) params.set("w", String(state.weight));
  if (state.seed !== base.seed) params.set("seed", String(state.seed));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.line !== base.colors.line) params.set("ln", state.colors.line.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("r", String(state.repeatWidth));
  return params.toString();
}
