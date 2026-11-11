import type { Locale, OrigamiColors, OrigamiGuide, OrigamiModel, OrigamiPrint, OrigamiRequest } from "./generator";

/** The origami builder's options, colors and share links. */

/** Easiest first. */
export const MODEL_OPTIONS: OrigamiModel[] = ["dog", "cup", "fortune-teller", "santa-hat", "christmas-tree", "samurai-helmet", "crane"];
export const PRINT_OPTIONS: OrigamiPrint[] = ["plain", "asanoha", "seigaiha", "shippo", "kikko", "dots", "truchet", "waves"];
/** Inches. Each fits a letter page at true size; 6" is close to the common 15 cm square. */
export const PAPER_OPTIONS = [5, 6, 7, 7.5];
export const GUIDE_OPTIONS: OrigamiGuide[] = ["none", "front", "back"];

export const COLOR_PRESETS: ({ id: "indigo" | "vermilion" | "pine" | "gold" } & OrigamiColors)[] = [
  { id: "indigo", front: "#23395d", back: "#f4ecdc", accent: "#f4ecdc" },
  { id: "vermilion", front: "#b5533c", back: "#f4ecdc", accent: "#f6e7c8" },
  { id: "pine", front: "#4f7a5e", back: "#f4ecdc", accent: "#f4ecdc" },
  { id: "gold", front: "#c99a2e", back: "#f4ecdc", accent: "#fbf3e4" },
];

export function defaultOrigamiState(locale: Locale = "en"): OrigamiRequest {
  // The paper's colors are primary colors, the same in every language.
  const { front, back, accent } = COLOR_PRESETS[0];
  return {
    ...(locale === "en" ? {} : { locale }),
    model: "crane",
    print: "asanoha",
    paperSize: 6,
    guide: "back",
    colors: { front, back, accent },
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const hex = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

export function parseOrigamiState(params: { get(name: string): string | null }, locale: Locale = "en"): OrigamiRequest {
  const base = defaultOrigamiState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    model: pick(params.get("m"), MODEL_OPTIONS, base.model, (raw) => raw as OrigamiModel),
    print: pick(params.get("p"), PRINT_OPTIONS, base.print, (raw) => raw as OrigamiPrint),
    paperSize: pick(params.get("s"), PAPER_OPTIONS, base.paperSize, Number),
    guide: pick(params.get("g"), GUIDE_OPTIONS, base.guide, (raw) => raw as OrigamiGuide),
    colors: {
      front: hex(params.get("f"), base.colors.front),
      back: hex(params.get("b"), base.colors.back),
      accent: hex(params.get("a"), base.colors.accent),
    },
  };
}

export function serializeOrigamiState(state: OrigamiRequest): string {
  const base = defaultOrigamiState(state.locale);
  const params = new URLSearchParams();
  if (state.model !== base.model) params.set("m", state.model);
  if (state.print !== base.print) params.set("p", state.print);
  if (state.paperSize !== base.paperSize) params.set("s", String(state.paperSize));
  if (state.guide !== base.guide) params.set("g", state.guide);
  if (state.colors.front !== base.colors.front) params.set("f", state.colors.front.slice(1));
  if (state.colors.back !== base.colors.back) params.set("b", state.colors.back.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("a", state.colors.accent.slice(1));
  return params.toString();
}
