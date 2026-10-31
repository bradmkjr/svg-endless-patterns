import type { Locale, TartanRequest, TartanStripe } from "./generator";
import { localeAccent } from "./localeAccent";
import type { Messages } from "./i18n";

/** The tartan builder's options, presets and share links. */

export const MAX_STRIPES = 8;
export const COUNT_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];
export const TPI_OPTIONS = [12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 60];
export const WIDTH_OPTIONS = Array.from({ length: 77 }, (_, i) => i + 4);
export const LENGTH_OPTIONS = Array.from({ length: 117 }, (_, i) => i + 4);

/** Invented for this site: no preset copies or stands for a named tartan. */
export const TARTAN_PRESETS: { id: keyof Messages["tartan"]["presets"]; stripes: TartanStripe[] }[] = [
  { id: "forest", stripes: [{ color: "#1b2a49", count: 16 }, { color: "#1f5c3d", count: 16 }, { color: "#1b2a49", count: 4 }, { color: "#c23b2e", count: 2 }, { color: "#f2e6c4", count: 1 }] },
  { id: "ember", stripes: [{ color: "#8c1c13", count: 20 }, { color: "#1a1a1a", count: 12 }, { color: "#8c1c13", count: 3 }, { color: "#e8b92f", count: 2 }] },
  { id: "harbor", stripes: [{ color: "#6b7a8f", count: 18 }, { color: "#f0ece2", count: 4 }, { color: "#23395d", count: 10 }, { color: "#f0ece2", count: 2 }] },
  { id: "check", stripes: [{ color: "#a31621", count: 24 }, { color: "#111111", count: 24 }] },
];

export function defaultTartanState(locale: Locale = "en"): TartanRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    // The thin overcheck is the secondary color.
    stripes: TARTAN_PRESETS[0].stripes.map((stripe, i) => (i === 3 ? { ...stripe, color: localeAccent(locale, stripe.color) } : stripe)),
    mirrored: true,
    threadsPerInch: 24,
    width: 12,
    length: 60,
  };
}

const encodeStripes = (stripes: TartanStripe[]) => stripes.map((s) => `${s.color.slice(1)}.${s.count}`).join("-");

function decodeStripes(raw: string | null): TartanStripe[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length < 2 || parts.length > MAX_STRIPES) return null;
  const stripes = parts.map((part) => {
    const [hex, count] = part.split(".");
    return /^[0-9a-f]{6}$/i.test(hex) && COUNT_OPTIONS.includes(Number(count)) ? { color: `#${hex.toLowerCase()}`, count: Number(count) } : null;
  });
  return stripes.every(Boolean) ? (stripes as TartanStripe[]) : null;
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function parseTartanState(params: { get(name: string): string | null }, locale: Locale = "en"): TartanRequest {
  const base = defaultTartanState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    stripes: decodeStripes(params.get("s")) ?? base.stripes,
    mirrored: params.get("mirror") !== "0",
    threadsPerInch: pick(params.get("tpi"), TPI_OPTIONS, base.threadsPerInch),
    width: pick(params.get("w"), WIDTH_OPTIONS, base.width),
    length: pick(params.get("l"), LENGTH_OPTIONS, base.length),
  };
}

export function serializeTartanState(state: TartanRequest): string {
  const base = defaultTartanState(state.locale);
  const params = new URLSearchParams();
  if (encodeStripes(state.stripes) !== encodeStripes(base.stripes)) params.set("s", encodeStripes(state.stripes));
  if (!state.mirrored) params.set("mirror", "0");
  if (state.threadsPerInch !== base.threadsPerInch) params.set("tpi", String(state.threadsPerInch));
  if (state.width !== base.width) params.set("w", String(state.width));
  if (state.length !== base.length) params.set("l", String(state.length));
  return params.toString();
}
