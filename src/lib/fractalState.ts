import type { FractalColors, FractalRequest, FractalType, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The fractal builder's options, defaults and share links. */

export const TYPE_OPTIONS: FractalType[] = ["koch-snowflake", "sierpinski-triangle", "sierpinski-carpet", "dragon-curve", "hilbert-curve", "levy-curve", "gosper-curve", "fractal-tree", "pythagoras-tree"];
export const WEIGHT_OPTIONS = [1, 2, 3, 4, 6, 8, 12];
export const ANGLE_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
/** The two trees are the only types with an angle to set. */
export const ANGLED_TYPES: FractalType[] = ["fractal-tree", "pythagoras-tree"];
/** The deepest each type offers. The API enforces the same limits. */
export const FRACTAL_MAX_DEPTH: Record<FractalType, number> = { "koch-snowflake": 6, "sierpinski-triangle": 7, "sierpinski-carpet": 4, "dragon-curve": 14, "hilbert-curve": 7, "levy-curve": 14, "gosper-curve": 5, "fractal-tree": 12, "pythagoras-tree": 11 };
export const depthOptions = (type: FractalType) => Array.from({ length: FRACTAL_MAX_DEPTH[type] }, (_, i) => i + 1);

/** A depth that shows the idea and prints crisply. */
const DEFAULT_DEPTH: Record<FractalType, number> = { "koch-snowflake": 4, "sierpinski-triangle": 5, "sierpinski-carpet": 3, "dragon-curve": 11, "hilbert-curve": 5, "levy-curve": 11, "gosper-curve": 4, "fractal-tree": 10, "pythagoras-tree": 9 };
const COLORS: FractalColors = { background: "#f7f3ea", primary: "#1f3a5f", accent: "#c8553d" };
const DEFAULT_TYPE: FractalType = "dragon-curve";
const DEFAULT_WEIGHT = 3;
const DEFAULT_ANGLE = 30;

export function defaultFractalState(locale: Locale = "en", type: FractalType = DEFAULT_TYPE): FractalRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    type,
    depth: DEFAULT_DEPTH[type],
    weight: DEFAULT_WEIGHT,
    angle: DEFAULT_ANGLE,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
  };
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

export function parseFractalState(params: { get(name: string): string | null }, locale: Locale = "en"): FractalRequest {
  const type = TYPE_OPTIONS.find((t) => t === params.get("t")) ?? DEFAULT_TYPE;
  const base = defaultFractalState(locale, type);
  return {
    ...base,
    depth: pick(params.get("d"), depthOptions(type), base.depth),
    weight: pick(params.get("w"), WEIGHT_OPTIONS, base.weight),
    angle: pick(params.get("a"), ANGLE_OPTIONS, base.angle),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      primary: decodeColor(params.get("c1"), base.colors.primary),
      accent: decodeColor(params.get("c2"), base.colors.accent),
    },
  };
}

export function serializeFractalState(state: FractalRequest): string {
  const base = defaultFractalState(state.locale, state.type);
  const params = new URLSearchParams();
  if (state.type !== DEFAULT_TYPE) params.set("t", state.type);
  if (state.depth !== base.depth) params.set("d", String(state.depth));
  if (state.weight !== base.weight) params.set("w", String(state.weight));
  if (state.angle !== base.angle) params.set("a", String(state.angle));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("c1", state.colors.primary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("c2", state.colors.accent.slice(1));
  return params.toString();
}
