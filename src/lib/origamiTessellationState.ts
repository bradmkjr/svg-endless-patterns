import type { CreaseColors, Locale, OrigamiTessellationRequest, TessellationPattern } from "./generator";

/** The origami tessellation builder's options, colors and share links. */

export const PATTERN_OPTIONS: TessellationPattern[] = ["miura-ori", "yoshimura", "waterbomb", "square-twist"];
/**
 * Each pattern's angle, in degrees, over the range it folds flat in. Miura-ori: the
 * parallelograms' acute angle. Yoshimura and waterbomb: the diagonals' slope. Square twist:
 * how far each square turns.
 */
export const ANGLE_RANGES: Record<TessellationPattern, { min: number; max: number; step: number; default: number }> = {
  "miura-ori": { min: 50, max: 85, step: 5, default: 70 },
  yoshimura: { min: 30, max: 60, step: 5, default: 45 },
  waterbomb: { min: 30, max: 60, step: 5, default: 45 },
  "square-twist": { min: 10, max: 35, step: 5, default: 25 },
};
export const GRID_MIN = 2;
export const GRID_MAX = 16;
/** Sheet widths, in inches. */
export const WIDTH_OPTIONS = [6, 8, 10, 12];

/** The angles a pattern takes, smallest first. */
export function angleOptions(pattern: TessellationPattern): number[] {
  const { min, max, step } = ANGLE_RANGES[pattern];
  return Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);
}

/** Navy mountains and rust valleys on cream: the site's own colors, the same in every language. */
const COLORS: CreaseColors = { paper: "#f7f3ea", mountain: "#23395d", valley: "#b5533c" };

export function defaultOrigamiTessellationState(locale: Locale = "en", pattern: TessellationPattern = "miura-ori"): OrigamiTessellationRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    pattern,
    cols: 6,
    rows: 6,
    angle: ANGLE_RANGES[pattern].default,
    width: 8,
    colors: { ...COLORS },
  };
}

const hex = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);
function grid(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return raw !== null && Number.isInteger(value) && value >= GRID_MIN && value <= GRID_MAX ? value : fallback;
}

export function parseOrigamiTessellationState(params: { get(name: string): string | null }, locale: Locale = "en"): OrigamiTessellationRequest {
  const pattern = PATTERN_OPTIONS.find((p) => p === params.get("t")) ?? "miura-ori";
  const base = defaultOrigamiTessellationState(locale, pattern);
  const angle = Number(params.get("a"));
  const width = Number(params.get("w"));
  return {
    ...base,
    cols: grid(params.get("c"), base.cols),
    rows: grid(params.get("r"), base.rows),
    // An angle outside this pattern's range falls back to its own default.
    angle: params.get("a") !== null && angleOptions(pattern).includes(angle) ? angle : base.angle,
    width: params.get("w") !== null && WIDTH_OPTIONS.includes(width) ? width : base.width,
    colors: {
      paper: hex(params.get("p"), base.colors.paper),
      mountain: hex(params.get("m"), base.colors.mountain),
      valley: hex(params.get("v"), base.colors.valley),
    },
  };
}

export function serializeOrigamiTessellationState(state: OrigamiTessellationRequest): string {
  const base = defaultOrigamiTessellationState(state.locale, state.pattern);
  const params = new URLSearchParams();
  if (state.pattern !== "miura-ori") params.set("t", state.pattern);
  if (state.cols !== base.cols) params.set("c", String(state.cols));
  if (state.rows !== base.rows) params.set("r", String(state.rows));
  if (state.angle !== base.angle) params.set("a", String(state.angle));
  if (state.width !== base.width) params.set("w", String(state.width));
  if (state.colors.paper !== base.colors.paper) params.set("p", state.colors.paper.slice(1));
  if (state.colors.mountain !== base.colors.mountain) params.set("m", state.colors.mountain.slice(1));
  if (state.colors.valley !== base.colors.valley) params.set("v", state.colors.valley.slice(1));
  return params.toString();
}
