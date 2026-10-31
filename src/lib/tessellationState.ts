import type { GroupId, Locale, TessellationColors, TessellationMotif, TessellationRequest } from "./generator";
import { localeAccent } from "./localeAccent";

/** The tessellation builder's options, palettes and share links. */

export const GROUPS: GroupId[] = ["p1", "p2", "pm", "pg", "cm", "pmm", "pmg", "pgg", "cmm", "p4", "p4m", "p4g", "p3", "p3m1", "p31m", "p6", "p6m"];
export const MOTIFS: TessellationMotif[] = ["leaf", "fish", "bird", "paisley", "flag", "sailboat"];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12];
export const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export type PaletteId = "ink" | "clay" | "garden" | "tide";

export const TESSELLATION_PALETTES: { id: PaletteId; colors: TessellationColors }[] = [
  { id: "ink", colors: { background: "#f5efe0", primary: "#1f3a5f", accent: "#c8553d" } },
  { id: "clay", colors: { background: "#f3dfc8", primary: "#9c4a2f", accent: "#2f4858" } },
  { id: "garden", colors: { background: "#eef2df", primary: "#2f6b45", accent: "#d9902f" } },
  { id: "tide", colors: { background: "#123c52", primary: "#f2e9d0", accent: "#45b5aa" } },
];

export function defaultTessellationState(locale: Locale = "en"): TessellationRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    motif: "leaf",
    group: "p4",
    colors: { ...TESSELLATION_PALETTES[0].colors, accent: localeAccent(locale, TESSELLATION_PALETTES[0].colors.accent) },
    repeatWidth: 4,
    across: 4,
    down: 3,
    outlines: false,
  };
}

function pickColor(raw: string | null, fallback: string): string {
  return raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback;
}

function pickNumber(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

function pickWord<T extends string>(raw: string | null, options: T[], fallback: T): T {
  return options.includes(raw as T) ? (raw as T) : fallback;
}

export function parseTessellationState(params: { get(name: string): string | null }, locale: Locale = "en"): TessellationRequest {
  const base = defaultTessellationState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    motif: pickWord(params.get("m"), MOTIFS, base.motif),
    group: pickWord(params.get("g"), GROUPS, base.group),
    colors: {
      background: pickColor(params.get("bg"), base.colors.background),
      primary: pickColor(params.get("c1"), base.colors.primary),
      accent: pickColor(params.get("c2"), base.colors.accent),
    },
    repeatWidth: pickNumber(params.get("w"), REPEAT_OPTIONS, base.repeatWidth),
    across: pickNumber(params.get("x"), COUNT_OPTIONS, base.across),
    down: pickNumber(params.get("y"), COUNT_OPTIONS, base.down),
    outlines: params.get("lines") === "1",
  };
}

export function serializeTessellationState(state: TessellationRequest): string {
  const base = defaultTessellationState(state.locale);
  const params = new URLSearchParams();
  if (state.motif !== base.motif) params.set("m", state.motif);
  if (state.group !== base.group) params.set("g", state.group);
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.primary !== base.colors.primary) params.set("c1", state.colors.primary.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("c2", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("w", String(state.repeatWidth));
  if (state.across !== base.across) params.set("x", String(state.across));
  if (state.down !== base.down) params.set("y", String(state.down));
  if (state.outlines) params.set("lines", "1");
  return params.toString();
}
