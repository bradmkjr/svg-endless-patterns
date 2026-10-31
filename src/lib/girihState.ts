import type { GirihColors, GirihRequest, GirihStar, GirihSymmetry, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The geometric star and girih builder's options, palettes and share links. */

export const SYMMETRY_OPTIONS: GirihSymmetry[] = [4, 6, 8, 10, 12];
/** Sharp points need a line angle other than 54 degrees, which the girih tiles don't allow. */
export const STARS_FOR: Record<GirihSymmetry, GirihStar[]> = {
  4: ["star", "sharp", "rosette"],
  6: ["star", "sharp", "rosette"],
  8: ["star", "sharp", "rosette"],
  10: ["star", "rosette"],
  12: ["star", "sharp", "rosette"],
};
export const WEIGHT_OPTIONS = [2, 3, 4, 6, 8, 10];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
export const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

type PaletteId = "lapis" | "terracotta" | "garden" | "ink";

/** Invented for this site, not copied from any building or manuscript. */
export const GIRIH_PALETTES: { id: PaletteId; colors: GirihColors }[] = [
  { id: "lapis", colors: { background: "#f4ecdc", primary: "#23395d", accent: "#2f8f9d", line: "#b8862b" } },
  { id: "terracotta", colors: { background: "#f6e7d3", primary: "#b5533c", accent: "#e0a458", line: "#3a2418" } },
  { id: "garden", colors: { background: "#eef2e2", primary: "#1f5c3d", accent: "#9dbf6b", line: "#14301f" } },
  { id: "ink", colors: { background: "#ffffff", primary: "#ffffff", accent: "#e8e8e8", line: "#111111" } },
];

export function defaultGirihState(locale: Locale = "en"): GirihRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry: 10,
    star: "star",
    lineWeight: 4,
    colors: { ...GIRIH_PALETTES[0].colors, accent: localeAccent(locale, GIRIH_PALETTES[0].colors.accent) },
    showTiles: false,
    repeatWidth: 6,
    across: 3,
    down: 3,
  };
}

const HEX = /^[0-9a-f]{6}$/i;
const ROLES = ["background", "primary", "accent", "line"] as const;

const encodeColors = (colors: GirihColors) => ROLES.map((role) => colors[role].slice(1)).join("-");

function decodeColors(raw: string | null): GirihColors | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length !== ROLES.length || !parts.every((part) => HEX.test(part))) return null;
  const [background, primary, accent, line] = parts.map((part) => `#${part.toLowerCase()}`);
  return { background, primary, accent, line };
}

function pick<T extends number>(raw: string | null, options: readonly T[], fallback: T): T {
  const value = Number(raw);
  return raw !== null && raw !== "" ? (options.find((option) => option === value) ?? fallback) : fallback;
}

export function parseGirihState(params: { get(name: string): string | null }, locale: Locale = "en"): GirihRequest {
  const base = defaultGirihState(locale);
  const symmetry = pick(params.get("n"), SYMMETRY_OPTIONS, base.symmetry);
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry,
    // A star type is only kept if this symmetry can draw it.
    star: STARS_FOR[symmetry].find((star) => star === params.get("star")) ?? base.star,
    lineWeight: pick(params.get("weight"), WEIGHT_OPTIONS, base.lineWeight),
    colors: decodeColors(params.get("c")) ?? base.colors,
    showTiles: params.get("tiles") === "1",
    repeatWidth: pick(params.get("w"), REPEAT_OPTIONS, base.repeatWidth),
    across: pick(params.get("x"), COUNT_OPTIONS, base.across),
    down: pick(params.get("y"), COUNT_OPTIONS, base.down),
  };
}

export function serializeGirihState(state: GirihRequest): string {
  const base = defaultGirihState(state.locale);
  const params = new URLSearchParams();
  if (state.symmetry !== base.symmetry) params.set("n", String(state.symmetry));
  if (state.star !== base.star) params.set("star", state.star);
  if (state.lineWeight !== base.lineWeight) params.set("weight", String(state.lineWeight));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("c", encodeColors(state.colors));
  if (state.showTiles) params.set("tiles", "1");
  if (state.repeatWidth !== base.repeatWidth) params.set("w", String(state.repeatWidth));
  if (state.across !== base.across) params.set("x", String(state.across));
  if (state.down !== base.down) params.set("y", String(state.down));
  return params.toString();
}
