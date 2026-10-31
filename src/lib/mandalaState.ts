import type { Locale, MandalaMotif, MandalaRequest } from "./generator";

/** The mandala builder's options, defaults and share links. */

export const SYMMETRY_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 6);
export const RING_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
export const MOTIF_OPTIONS: MandalaMotif[] = ["petals", "arcs", "dots", "scallops", "diamonds", "triangles"];
export const LINE_OPTIONS = [1, 2, 3, 4, 6, 8];
export const MAX_COLORS = 6;
export const MAX_SEED = 999999;

const LOOKS: Record<Locale, { colors: string[]; background: string; outline: string }> = {
  en: { colors: ["#23395d", "#2f7f79", "#d98e32", "#b8473d"], background: "#f7f1e3", outline: "#1d2b3a" },
  es: { colors: ["#aa151b", "#f1bf00", "#7a1016", "#e0872a"], background: "#fbf3df", outline: "#3a1a10" },
  fr: { colors: ["#0055a4", "#ef4135", "#6d8fc0", "#f6f5f1"], background: "#fbfaf6", outline: "#14213d" },
  de: { colors: ["#1f1f1f", "#d00000", "#ffce00", "#8a6a00"], background: "#f6f2e8", outline: "#111111" },
  pt: { colors: ["#009b3a", "#ffdf00", "#002776", "#5fbf73"], background: "#fbfbf2", outline: "#0d2b1a" },
};

export function defaultMandalaState(locale: Locale = "en"): MandalaRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry: 12,
    rings: 5,
    motifs: MOTIF_OPTIONS,
    seed: 12,
    lineWeight: 3,
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

/** Any unknown name rejects the whole list. Kept in catalog order so a list has one spelling. */
function decodeMotifs(raw: string | null): MandalaMotif[] | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (!parts.every((part) => MOTIF_OPTIONS.some((m) => m === part))) return null;
  return MOTIF_OPTIONS.filter((m) => parts.includes(m));
}

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function parseMandalaState(params: { get(name: string): string | null }, locale: Locale = "en"): MandalaRequest {
  const base = defaultMandalaState(locale);
  const seed = params.get("seed");
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry: pick(params.get("n"), SYMMETRY_OPTIONS, base.symmetry),
    rings: pick(params.get("r"), RING_OPTIONS, base.rings),
    motifs: decodeMotifs(params.get("m")) ?? base.motifs,
    seed: seed && /^\d{1,6}$/.test(seed) ? Number(seed) : base.seed,
    lineWeight: pick(params.get("w"), LINE_OPTIONS, base.lineWeight),
    colors: decodeColors(params.get("k")) ?? base.colors,
    background: decodeColor(params.get("bg"), base.background),
    outline: decodeColor(params.get("ol"), base.outline),
  };
}

const encodeColors = (colors: string[]) => colors.map((c) => c.slice(1)).join("-");

export function serializeMandalaState(state: MandalaRequest): string {
  const base = defaultMandalaState(state.locale);
  const params = new URLSearchParams();
  if (state.symmetry !== base.symmetry) params.set("n", String(state.symmetry));
  if (state.rings !== base.rings) params.set("r", String(state.rings));
  if (state.motifs.join(".") !== base.motifs.join(".")) params.set("m", state.motifs.join("."));
  if (state.seed !== base.seed) params.set("seed", String(state.seed));
  if (state.lineWeight !== base.lineWeight) params.set("w", String(state.lineWeight));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("k", encodeColors(state.colors));
  if (state.background !== base.background) params.set("bg", state.background.slice(1));
  if (state.outline !== base.outline) params.set("ol", state.outline.slice(1));
  return params.toString();
}
