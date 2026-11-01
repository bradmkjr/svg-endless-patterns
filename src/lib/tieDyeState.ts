import type { Locale, TieDyeRequest, TieDyeTechnique } from "./generator";
import { localeAccent } from "./localeAccent";

/** The tie-dye builder's options, defaults and share links. Seeds stay out of links, as in `toolOptions`. */

export const TECHNIQUE_OPTIONS: TieDyeTechnique[] = ["spiral", "bullseye", "accordion", "sunburst", "chevron", "double-spiral"];
export const BAND_OPTIONS = [4, 6, 8, 10, 12];
export const GARMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
/** Dye powder per cup of water: plain, * and ** on the jar's label. */
export const STRENGTH_OPTIONS = [2, 4, 8];
export const MIN_DYES = 1;
export const MAX_DYES = 4;
export const MAX_SEED = 999999;
const DYES = ["#e0245e", "#f5b400", "#1568c0"];
const FABRIC = "#ffffff";

export function defaultTieDyeState(locale: Locale = "en"): TieDyeRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    technique: "spiral",
    bands: 6,
    dyes: DYES.map((color, i) => (i === 1 ? localeAccent(locale, color) : color)),
    fabric: FABRIC,
    seed: 7,
    garments: 1,
    strength: 2,
  };
}

const HEX = /^[0-9a-f]{6}$/i;

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

function decodeDyes(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length < MIN_DYES || parts.length > MAX_DYES || !parts.every((part) => HEX.test(part))) return null;
  return parts.map((part) => `#${part.toLowerCase()}`);
}

export function parseTieDyeState(params: { get(name: string): string | null }, locale: Locale = "en"): TieDyeRequest {
  const base = defaultTieDyeState(locale);
  const fabric = params.get("f");
  return {
    ...base,
    technique: TECHNIQUE_OPTIONS.find((t) => t === params.get("t")) ?? base.technique,
    bands: pick(params.get("b"), BAND_OPTIONS, base.bands),
    dyes: decodeDyes(params.get("k")) ?? base.dyes,
    fabric: fabric && HEX.test(fabric) ? `#${fabric.toLowerCase()}` : base.fabric,
    garments: pick(params.get("g"), GARMENT_OPTIONS, base.garments),
    strength: pick(params.get("s"), STRENGTH_OPTIONS, base.strength),
  };
}

const encodeDyes = (dyes: string[]) => dyes.map((c) => c.slice(1)).join("-");

export function serializeTieDyeState(state: TieDyeRequest): string {
  const base = defaultTieDyeState(state.locale);
  const params = new URLSearchParams();
  if (state.technique !== base.technique) params.set("t", state.technique);
  if (state.bands !== base.bands) params.set("b", String(state.bands));
  if (encodeDyes(state.dyes) !== encodeDyes(base.dyes)) params.set("k", encodeDyes(state.dyes));
  if (state.fabric !== base.fabric) params.set("f", state.fabric.slice(1));
  if (state.garments !== base.garments) params.set("g", String(state.garments));
  if (state.strength !== base.strength) params.set("s", String(state.strength));
  return params.toString();
}
