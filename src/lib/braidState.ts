import type { BraidFamily, BraidPattern, BraidRequest, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The braid builder's options, defaults and share links. The braids themselves are worked out by the API. */

export type BraidView = "braid" | "chart";
export type BraidState = BraidRequest & { view: BraidView };

export const PATTERN_OPTIONS: BraidPattern[] = ["candy-stripe", "chevron", "inverse-chevron", "zigzag", "diamond", "heart", "three-strand", "four-strand", "five-strand", "six-strand", "fishtail", "endless-falls"];
export const VIEW_OPTIONS: BraidView[] = ["braid", "chart"];
export const REPEAT_OPTIONS = [1, 2, 3, 4, 6, 8];
export const FAMILY_OPTIONS: BraidFamily[] = ["knotted", "flat", "falls"];

/** Each pattern's family, strand counts (the first is the default) and most colors, as the API takes them. */
export const PATTERNS: Record<BraidPattern, { family: BraidFamily; strands: number[]; colors: number }> = {
  "candy-stripe": { family: "knotted", strands: [6, 4, 5, 7, 8, 9, 10, 12], colors: 12 },
  chevron: { family: "knotted", strands: [8, 4, 6, 10, 12, 14, 16], colors: 8 },
  "inverse-chevron": { family: "knotted", strands: [8, 4, 6, 10, 12, 14, 16], colors: 8 },
  zigzag: { family: "knotted", strands: [6, 4, 5, 7, 8, 10, 12], colors: 12 },
  diamond: { family: "knotted", strands: [12, 10, 14, 16, 18, 20], colors: 2 },
  heart: { family: "knotted", strands: [16, 14, 18, 20], colors: 2 },
  "three-strand": { family: "flat", strands: [3], colors: 3 },
  "four-strand": { family: "flat", strands: [4], colors: 4 },
  "five-strand": { family: "flat", strands: [5], colors: 5 },
  "six-strand": { family: "flat", strands: [6], colors: 6 },
  fishtail: { family: "flat", strands: [8, 6, 10, 12], colors: 12 },
  "endless-falls": { family: "falls", strands: [4], colors: 2 },
};

export const strandOptions = (pattern: BraidPattern) => [...PATTERNS[pattern].strands].sort((a, b) => a - b);

/** Navy and cream are the primary colors in every language; the second color is the language's own. */
const NAVY = "#23395d";
const RUST = "#b5533c";
const CREAM = "#f4ecdc";
const GREEN = "#4f7a5e";
const DEFAULT_PATTERN: BraidPattern = "chevron";

export function defaultColors(pattern: BraidPattern, locale: Locale = "en"): string[] {
  return [NAVY, localeAccent(locale, RUST), CREAM, GREEN].slice(0, Math.min(PATTERNS[pattern].colors, 4));
}

export function defaultBraidState(locale: Locale = "en", pattern: BraidPattern = DEFAULT_PATTERN): BraidState {
  return {
    ...(locale === "en" ? {} : { locale }),
    pattern,
    strands: PATTERNS[pattern].strands[0],
    colors: defaultColors(pattern, locale),
    repeats: 2,
    view: "braid",
  };
}

/** Settings the pattern can't take fall back to its own. */
export function normalizeBraid(state: BraidState): BraidState {
  const info = PATTERNS[state.pattern];
  const colors = state.colors.slice(0, info.colors);
  return {
    ...state,
    strands: info.strands.includes(state.strands) ? state.strands : info.strands[0],
    colors: colors.length ? colors : defaultColors(state.pattern, state.locale),
  };
}

/** What the API is asked for: everything but the view. */
export function braidRequest(state: BraidState): BraidRequest {
  const request: BraidRequest & { view?: BraidView } = { ...state };
  delete request.view;
  return request;
}

const encodeColors = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");

function decodeColors(raw: string | null, most: number): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length > most || !parts.every((p) => /^[0-9a-f]{6}$/i.test(p))) return null;
  return parts.map((p) => `#${p.toLowerCase()}`);
}

export function parseBraidState(params: { get(name: string): string | null }, locale: Locale = "en"): BraidState {
  const pattern = PATTERN_OPTIONS.find((p) => p === params.get("p")) ?? DEFAULT_PATTERN;
  const base = defaultBraidState(locale, pattern);
  const strands = Number(params.get("n"));
  const repeats = Number(params.get("r"));
  return normalizeBraid({
    ...base,
    strands: PATTERNS[pattern].strands.includes(strands) ? strands : base.strands,
    colors: decodeColors(params.get("c"), PATTERNS[pattern].colors) ?? base.colors,
    repeats: REPEAT_OPTIONS.includes(repeats) ? repeats : base.repeats,
    view: VIEW_OPTIONS.find((v) => v === params.get("v")) ?? base.view,
  });
}

export function serializeBraidState(state: BraidState): string {
  const base = defaultBraidState(state.locale, state.pattern);
  const params = new URLSearchParams();
  if (state.pattern !== DEFAULT_PATTERN) params.set("p", state.pattern);
  if (state.strands !== base.strands) params.set("n", String(state.strands));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("c", encodeColors(state.colors));
  if (state.repeats !== base.repeats) params.set("r", String(state.repeats));
  if (state.view !== base.view) params.set("v", state.view);
  return params.toString();
}
