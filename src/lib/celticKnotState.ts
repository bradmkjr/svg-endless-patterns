import type { CelticBreakPattern, CelticInterlace, CelticKnotRequest, Locale } from "./generator";

/** The Celtic knot builder's options, defaults and share links. */

export const SIZE_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 2);
export const PATTERN_OPTIONS: CelticBreakPattern[] = ["none", "random", "mirror", "rotate", "frame", "cross", "diamond", "lattice"];
/** The patterns drawn from the seed; the others are fixed for a given grid. */
export const SEEDED_PATTERNS: CelticBreakPattern[] = ["random", "mirror", "rotate"];
export const DENSITY_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60];
export const RIBBON_OPTIONS = [30, 40, 50, 60, 70, 80];
export const INTERLACE_OPTIONS: CelticInterlace[] = ["open", "tight", "off"];
export const INCH_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
export const MAX_COLORS = 6;
export const MAX_SEED = 999999;

const INK = "#1d2b3a";

const LOOKS: Record<Locale, { colors: string[]; background: string; outline: string }> = {
  en: { colors: ["#1f5c3d", "#b8862b", "#23395d"], background: "#f4ecdc", outline: INK },
  es: { colors: ["#aa151b", "#f1bf00", "#7a1016"], background: "#fbf3df", outline: "#3a1a10" },
  fr: { colors: ["#0055a4", "#ef4135", "#6d8fc0"], background: "#fbfaf6", outline: "#14213d" },
  de: { colors: ["#1f1f1f", "#d00000", "#ffce00"], background: "#f6f2e8", outline: "#111111" },
  pt: { colors: ["#009b3a", "#ffdf00", "#002776"], background: "#fbfbf2", outline: "#0d2b1a" },
};

export function defaultCelticKnotState(locale: Locale = "en"): CelticKnotRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    cols: 6,
    rows: 6,
    pattern: "mirror",
    seed: 12,
    density: 25,
    ribbon: 60,
    interlace: "open",
    perStrand: true,
    size: 8,
    ...LOOKS[locale],
  };
}

const HEX = /^[0-9a-f]{6}$/i;

function decodeColors(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length > MAX_COLORS || !parts.every((part) => HEX.test(part))) return null;
  return parts.map((part) => `#${part.toLowerCase()}`);
}

const decodeColor = (raw: string | null, fallback: string) => (raw && HEX.test(raw) ? `#${raw.toLowerCase()}` : fallback);

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

function pickWord<T extends string>(raw: string | null, options: T[], fallback: T): T {
  return options.find((option) => option === raw) ?? fallback;
}

export function parseCelticKnotState(params: { get(name: string): string | null }, locale: Locale = "en"): CelticKnotRequest {
  const base = defaultCelticKnotState(locale);
  const seed = params.get("seed");
  return {
    ...(locale === "en" ? {} : { locale }),
    cols: pick(params.get("c"), SIZE_OPTIONS, base.cols),
    rows: pick(params.get("r"), SIZE_OPTIONS, base.rows),
    pattern: pickWord(params.get("p"), PATTERN_OPTIONS, base.pattern),
    seed: seed && /^\d{1,6}$/.test(seed) ? Number(seed) : base.seed,
    density: pick(params.get("d"), DENSITY_OPTIONS, base.density),
    ribbon: pick(params.get("w"), RIBBON_OPTIONS, base.ribbon),
    interlace: pickWord(params.get("i"), INTERLACE_OPTIONS, base.interlace),
    perStrand: params.get("each") !== "0",
    size: pick(params.get("in"), INCH_OPTIONS, base.size),
    colors: decodeColors(params.get("k")) ?? base.colors,
    background: decodeColor(params.get("bg"), base.background),
    outline: decodeColor(params.get("ol"), base.outline),
  };
}

const encodeColors = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");

export function serializeCelticKnotState(state: CelticKnotRequest): string {
  const base = defaultCelticKnotState(state.locale);
  const params = new URLSearchParams();
  if (state.cols !== base.cols) params.set("c", String(state.cols));
  if (state.rows !== base.rows) params.set("r", String(state.rows));
  if (state.pattern !== base.pattern) params.set("p", state.pattern);
  if (state.seed !== base.seed) params.set("seed", String(state.seed));
  if (state.density !== base.density) params.set("d", String(state.density));
  if (state.ribbon !== base.ribbon) params.set("w", String(state.ribbon));
  if (state.interlace !== base.interlace) params.set("i", state.interlace);
  if (!state.perStrand) params.set("each", "0");
  if (state.size !== base.size) params.set("in", String(state.size));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("k", encodeColors(state.colors));
  if (state.background !== base.background) params.set("bg", state.background.slice(1));
  if (state.outline !== base.outline) params.set("ol", state.outline.slice(1));
  return params.toString();
}
