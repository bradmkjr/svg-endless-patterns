import type { Locale, SashikoMotif, SashikoRequest } from "./generator";

/** The sashiko builder's options, colors and share links. */

export const MOTIF_OPTIONS: SashikoMotif[] = ["asanoha", "seigaiha", "shippo", "kikko", "kagome", "squares", "diamonds"];
export const SPACING_OPTIONS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
/** Stitch lengths, with labels: 3/16 falls between the eighths of a quilter's ruler. */
export const STITCH_OPTIONS: { value: number; label: string }[] = [
  { value: 0.125, label: '1/8"' },
  { value: 0.1875, label: '3/16"' },
  { value: 0.25, label: '1/4"' },
];
export const PANEL_OPTIONS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36];

export const COLOR_PRESETS: { id: "indigo" | "natural" | "charcoal"; cloth: string; thread: string }[] = [
  { id: "indigo", cloth: "#1f2a44", thread: "#f4f1e8" },
  { id: "natural", cloth: "#e9e1cf", thread: "#1f2a44" },
  { id: "charcoal", cloth: "#2b2b2b", thread: "#efe6d0" },
];

const FLAG_COLORS: Partial<Record<Locale, { cloth: string; thread: string }>> = {
  es: { cloth: "#aa151b", thread: "#f1bf00" },
  fr: { cloth: "#0055a4", thread: "#f6f5f1" },
  de: { cloth: "#1f1f1f", thread: "#ffce00" },
  pt: { cloth: "#009b3a", thread: "#ffdf00" },
};

export function defaultSashikoState(locale: Locale = "en"): SashikoRequest {
  const { cloth, thread } = FLAG_COLORS[locale] ?? COLOR_PRESETS[0];
  return {
    ...(locale === "en" ? {} : { locale }),
    motif: "asanoha",
    spacing: 2,
    stitch: 0.125,
    width: 12,
    height: 12,
    cloth,
    thread,
  };
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

const hex = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

export function parseSashikoState(params: { get(name: string): string | null }, locale: Locale = "en"): SashikoRequest {
  const base = defaultSashikoState(locale);
  const motif = MOTIF_OPTIONS.find((m) => m === params.get("m"));
  return {
    ...(locale === "en" ? {} : { locale }),
    motif: motif ?? base.motif,
    spacing: pick(params.get("sp"), SPACING_OPTIONS, base.spacing),
    stitch: pick(params.get("st"), STITCH_OPTIONS.map((s) => s.value), base.stitch),
    width: pick(params.get("w"), PANEL_OPTIONS, base.width),
    height: pick(params.get("h"), PANEL_OPTIONS, base.height),
    cloth: hex(params.get("c"), base.cloth),
    thread: hex(params.get("t"), base.thread),
  };
}

export function serializeSashikoState(state: SashikoRequest): string {
  const base = defaultSashikoState(state.locale);
  const params = new URLSearchParams();
  if (state.motif !== base.motif) params.set("m", state.motif);
  if (state.spacing !== base.spacing) params.set("sp", String(state.spacing));
  if (state.stitch !== base.stitch) params.set("st", String(state.stitch));
  if (state.width !== base.width) params.set("w", String(state.width));
  if (state.height !== base.height) params.set("h", String(state.height));
  if (state.cloth !== base.cloth) params.set("c", state.cloth.slice(1));
  if (state.thread !== base.thread) params.set("t", state.thread.slice(1));
  return params.toString();
}
