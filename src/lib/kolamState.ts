import type { KolamColors, KolamForm, KolamGrid, KolamLine, KolamRequest, KolamRule, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The kolam builder's options, default colors and share links. */

export const FORM_OPTIONS: KolamForm[] = ["sikku", "pulli", "kambi"];
export const GRID_OPTIONS: KolamGrid[] = ["square", "diamond", "hexagonal"];
export const RULE_OPTIONS: KolamRule[] = ["symmetric", "random"];
export const LINE_OPTIONS: KolamLine[] = ["single", "double"];
/** Odd, so a square repeat has a dot at its center for a symmetric kolam to turn about. */
export const SIZE_OPTIONS = [5, 7, 9, 11, 13, 15];
export const WEIGHT_OPTIONS = [4, 6, 8, 10, 12];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 7.5];
export const MAX_SEED = 999999;

/** A pale line on a dark ground, as rice flour shows on a swept doorstep. */
const COLORS: KolamColors = { background: "#3a2a22", line: "#f7f1e3", accent: "#e0a43a" };

export function defaultKolamState(locale: Locale = "en"): KolamRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    form: "sikku",
    grid: "square",
    size: 9,
    rule: "symmetric",
    line: "single",
    dots: true,
    weight: 8,
    seed: 7,
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
const decodeFlag = (raw: string | null, fallback: boolean) => (raw === "1" ? true : raw === "0" ? false : fallback);

export function parseKolamState(params: { get(name: string): string | null }, locale: Locale = "en"): KolamRequest {
  const base = defaultKolamState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    form: pick(params.get("f"), FORM_OPTIONS, base.form, (raw) => raw as KolamForm),
    grid: pick(params.get("g"), GRID_OPTIONS, base.grid, (raw) => raw as KolamGrid),
    size: pick(params.get("n"), SIZE_OPTIONS, base.size, Number),
    rule: pick(params.get("rule"), RULE_OPTIONS, base.rule, (raw) => raw as KolamRule),
    line: pick(params.get("l"), LINE_OPTIONS, base.line, (raw) => raw as KolamLine),
    dots: decodeFlag(params.get("dots"), base.dots),
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

/** Seeds stay out of share links: each tool remembers its last one in this browser instead. */
export function serializeKolamState(state: KolamRequest): string {
  const base = defaultKolamState(state.locale);
  const params = new URLSearchParams();
  if (state.form !== base.form) params.set("f", state.form);
  if (state.grid !== base.grid) params.set("g", state.grid);
  if (state.size !== base.size) params.set("n", String(state.size));
  if (state.rule !== base.rule) params.set("rule", state.rule);
  if (state.line !== base.line) params.set("l", state.line);
  if (state.dots !== base.dots) params.set("dots", state.dots ? "1" : "0");
  if (state.weight !== base.weight) params.set("w", String(state.weight));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.line !== base.colors.line) params.set("ln", state.colors.line.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("r", String(state.repeatWidth));
  return params.toString();
}
