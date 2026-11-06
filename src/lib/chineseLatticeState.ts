import type { ChineseLatticeRequest, LatticeColors, LatticeEdge, LatticeFramework, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The Chinese lattice builder's options, default colors and share links. */

export const FRAMEWORK_OPTIONS: LatticeFramework[] = ["square-fret", "octagon-square", "hexagon", "diagonal", "interlocking", "ice-ray"];
export const BAR_OPTIONS = [3, 4, 5, 6, 8, 10, 12];
export const DENSITY_OPTIONS = [1, 2, 3, 4];
export const DEPTH_OPTIONS = [0, 1, 2, 3];
export const EDGE_OPTIONS: LatticeEdge[] = ["frame", "open"];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
export const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8];
export const MAX_SEED = 999999;

/** Paper behind lacquered bars, in a dark wood frame. Invented for this site. */
const COLORS: LatticeColors = { background: "#f4ead5", line: "#8c2f1b", accent: "#3b2a1e" };

export function defaultChineseLatticeState(locale: Locale = "en"): ChineseLatticeRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    framework: "ice-ray",
    barWidth: 6,
    density: 2,
    depth: 1,
    edge: "frame",
    seed: 7,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
    repeatWidth: 8,
    across: 2,
    down: 3,
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null || raw === "") return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);
const decodeSeed = (raw: string | null, fallback: number) => (raw && /^\d{1,6}$/.test(raw) ? Number(raw) : fallback);

/** Seeds are read from a link but never written to one: see `rememberSeed`. */
export function parseChineseLatticeState(params: { get(name: string): string | null }, locale: Locale = "en"): ChineseLatticeRequest {
  const base = defaultChineseLatticeState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    framework: pick(params.get("f"), FRAMEWORK_OPTIONS, base.framework, (raw) => raw as LatticeFramework),
    barWidth: pick(params.get("bar"), BAR_OPTIONS, base.barWidth, Number),
    density: pick(params.get("d"), DENSITY_OPTIONS, base.density, Number),
    depth: pick(params.get("nest"), DEPTH_OPTIONS, base.depth, Number),
    edge: pick(params.get("edge"), EDGE_OPTIONS, base.edge, (raw) => raw as LatticeEdge),
    seed: decodeSeed(params.get("seed"), base.seed),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      line: decodeColor(params.get("ln"), base.colors.line),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
    repeatWidth: pick(params.get("w"), REPEAT_OPTIONS, base.repeatWidth, Number),
    across: pick(params.get("x"), COUNT_OPTIONS, base.across, Number),
    down: pick(params.get("y"), COUNT_OPTIONS, base.down, Number),
  };
}

export function serializeChineseLatticeState(state: ChineseLatticeRequest): string {
  const base = defaultChineseLatticeState(state.locale);
  const params = new URLSearchParams();
  if (state.framework !== base.framework) params.set("f", state.framework);
  if (state.barWidth !== base.barWidth) params.set("bar", String(state.barWidth));
  if (state.density !== base.density) params.set("d", String(state.density));
  if (state.depth !== base.depth) params.set("nest", String(state.depth));
  if (state.edge !== base.edge) params.set("edge", state.edge);
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.line !== base.colors.line) params.set("ln", state.colors.line.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("w", String(state.repeatWidth));
  if (state.across !== base.across) params.set("x", String(state.across));
  if (state.down !== base.down) params.set("y", String(state.down));
  return params.toString();
}
