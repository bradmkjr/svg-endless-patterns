import type { BlockInfo, Locale, PatternRequest, Setting } from "./generator";
import { localeAccent } from "./localeAccent";

/**
 * The builder's settings as the site offers them: option lists, palettes,
 * defaults and share links. What's generated from them is `lib/generator.ts`.
 */

export type PaletteId = "indigo" | "barn" | "sage" | "jewel" | "neutral" | "flag";
export type Palette = { id: PaletteId; colors: string[]; sashing: string; border: string };

export const PALETTES: Palette[] = [
  { id: "indigo", colors: ["#f4ecdc", "#23395d", "#b5533c", "#7f9ab8"], sashing: "#f4ecdc", border: "#23395d" },
  { id: "barn", colors: ["#f7f1e3", "#9c2b23", "#2f3e46", "#d9a441"], sashing: "#f7f1e3", border: "#9c2b23" },
  { id: "sage", colors: ["#eee9da", "#6f8467", "#b4552d", "#d6b77a"], sashing: "#eee9da", border: "#6f8467" },
  { id: "jewel", colors: ["#1f1b2e", "#c8326b", "#2c8c99", "#e8b92f"], sashing: "#1f1b2e", border: "#c8326b" },
  { id: "neutral", colors: ["#fafafa", "#2b2b2b", "#e4572e", "#a9a9a9"], sashing: "#fafafa", border: "#2b2b2b" },
];

/** Each language's default: the first palette, with its secondary color swapped for the language's. */
function flagPalette(locale: Locale): Palette {
  const { colors, sashing, border } = PALETTES[0];
  return { id: "flag", colors: colors.map((color, i) => (i === 2 ? localeAccent(locale, color) : color)), sashing, border };
}

/** The palette choices in `locale`, its default first. */
export function palettesFor(locale: Locale): Palette[] {
  return locale === "en" ? PALETTES : [flagPalette(locale), ...PALETTES];
}

export const SIZE_OPTIONS = Array.from({ length: 43 }, (_, i) => 3 + i / 2);
export const COUNT_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);
export const SASHING_OPTIONS = Array.from({ length: 13 }, (_, i) => i / 2);
export const BORDER_OPTIONS = Array.from({ length: 25 }, (_, i) => i / 2);
export const WOF_OPTIONS = [38, 39, 40, 41, 42, 43, 44];
export const SETTINGS: Setting[] = ["straight", "alternate", "quadrants"];

export function paletteColors(block: BlockInfo, palette: Palette): Record<string, string> {
  const colors: Record<string, string> = { sashing: palette.sashing, border: palette.border };
  block.fabrics.forEach((f, i) => {
    colors[f.id] = palette.colors[i % palette.colors.length];
  });
  return colors;
}

export function defaultState(block: BlockInfo, locale: Locale = "en"): PatternRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    size: 12,
    cols: 4,
    rows: 5,
    sashing: 0,
    border: 3,
    setting: "straight",
    wof: 40,
    seams: false,
    colors: paletteColors(block, palettesFor(locale)[0]),
  };
}

const HEX = /^[0-9a-f]{6}$/i;

function pick<T>(raw: string | null, options: readonly T[], parse: (s: string) => T, fallback: T): T {
  if (raw === null) return fallback;
  const value = parse(raw);
  return options.includes(value) ? value : fallback;
}

/** The state a share link describes. Anything invalid falls back to the default. */
export function parseState(block: BlockInfo, params: { get(name: string): string | null }, locale: Locale = "en"): PatternRequest {
  const base = defaultState(block, locale);
  const colors = { ...base.colors };
  for (const id of Object.keys(colors)) {
    const raw = params.get(`f_${id}`);
    if (raw && HEX.test(raw)) colors[id] = `#${raw.toLowerCase()}`;
  }
  return {
    ...(locale === "en" ? {} : { locale }),
    size: pick(params.get("size"), SIZE_OPTIONS, Number, base.size),
    cols: pick(params.get("cols"), COUNT_OPTIONS, Number, base.cols),
    rows: pick(params.get("rows"), COUNT_OPTIONS, Number, base.rows),
    sashing: pick(params.get("sash"), SASHING_OPTIONS, Number, base.sashing),
    border: pick(params.get("border"), BORDER_OPTIONS, Number, base.border),
    wof: pick(params.get("wof"), WOF_OPTIONS, Number, base.wof),
    setting: pick(params.get("set"), SETTINGS, (s) => s as Setting, base.setting),
    seams: params.get("seams") === "1",
    colors,
  };
}

/** The query string for a state: only what differs from the block's default. */
export function serializeState(block: BlockInfo, state: PatternRequest): string {
  const base = defaultState(block, state.locale);
  const params = new URLSearchParams();
  if (state.size !== base.size) params.set("size", String(state.size));
  if (state.cols !== base.cols) params.set("cols", String(state.cols));
  if (state.rows !== base.rows) params.set("rows", String(state.rows));
  if (state.sashing !== base.sashing) params.set("sash", String(state.sashing));
  if (state.border !== base.border) params.set("border", String(state.border));
  if (state.wof !== base.wof) params.set("wof", String(state.wof));
  if (state.setting !== base.setting) params.set("set", state.setting);
  if (state.seams) params.set("seams", "1");
  for (const [id, color] of Object.entries(state.colors)) {
    if (color !== base.colors[id]) params.set(`f_${id}`, color.slice(1));
  }
  return params.toString();
}
