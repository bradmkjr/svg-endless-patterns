import type { Locale, MandalaMotif, MandalaRequest, MandalaRingSpec } from "./generator";
import { localeAccent } from "./localeAccent";

/** The mandala builder's options, defaults and share links. */

export const SYMMETRY_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 6);
export const RING_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
export const MOTIF_OPTIONS: MandalaMotif[] = ["petals", "arcs", "dots", "scallops", "diamonds", "triangles", "lotus", "leaves", "teardrops", "stars", "hearts", "chevrons", "rays", "fans", "ogees"];
/** What a seed chooses from unless the link says otherwise, so older links keep their designs. */
const SEED_MOTIFS = MOTIF_OPTIONS.slice(0, 6);
export const MIN_PLAN_RINGS = 1;
export const MAX_PLAN_RINGS = 16;
export const REPEAT_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);
export const SIZE_OPTIONS = [40, 50, 60, 70, 80, 90, 100, 110, 120, 140, 160, 180, 200];
export const MIN_RING_SIZE = 30;
export const MAX_RING_SIZE = 200;
export const LINE_OPTIONS = [1, 2, 3, 4, 6, 8];
export const MAX_COLORS = 6;
export const MAX_SEED = 999999;

const LOOK = { colors: ["#23395d", "#2f7f79", "#d98e32", "#b8473d"], background: "#f7f1e3", outline: "#1d2b3a" };

const ring = (motif: MandalaMotif, repeat: number, size: number, color: number, band: number | null = null, accent = false, offset = false): MandalaRingSpec => ({ motif, repeat, size, color, band, accent, offset });

/** The opening design, from the center out. */
export const DEFAULT_RING_PLAN: MandalaRingSpec[] = [
  ring("lotus", 1, 110, 2),
  ring("dots", 2, 45, 0),
  ring("teardrops", 1, 100, 1, null, true, true),
  ring("chevrons", 2, 55, 3, 2),
  ring("petals", 1, 120, 0, null, true),
  ring("stars", 2, 70, 2, 0, false, true),
  ring("fans", 2, 110, 1),
  ring("dots", 4, 40, 3),
  ring("ogees", 2, 110, 3, null, true, true),
  ring("rays", 4, 60, 0, 2),
  ring("scallops", 3, 70, 1, null, true),
];

/** A new ring for the builder: the color after the one inside it. */
export function newRing(plan: MandalaRingSpec[]): MandalaRingSpec {
  return ring("petals", 2, 100, plan.length);
}

/** The plan with one ring moved. */
export function moveRing(plan: MandalaRingSpec[], from: number, to: number): MandalaRingSpec[] {
  const next = [...plan];
  const [ring] = next.splice(from, 1);
  next.splice(to, 0, ring);
  return next;
}

export function defaultMandalaState(locale: Locale = "en"): MandalaRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry: 12,
    rings: 5,
    ringPlan: DEFAULT_RING_PLAN,
    motifs: SEED_MOTIFS,
    seed: 12,
    lineWeight: 3,
    ...LOOK,
    colors: LOOK.colors.map((color, i) => (i === 3 ? localeAccent(locale, color) : color)),
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

/** motif.repeat.size.color.band.accent.offset, with rings joined by `_`. A band of `x` shows the background. */
const encodePlan = (plan: MandalaRingSpec[]) => plan.map((r) => [r.motif, r.repeat, r.size, r.color, r.band ?? "x", r.accent ? 1 : 0, r.offset ? 1 : 0].join(".")).join("_");

/** Any ring that doesn't read rejects the whole plan. */
function decodePlan(raw: string | null): MandalaRingSpec[] | null {
  if (!raw) return null;
  const parts = raw.split("_");
  if (parts.length < MIN_PLAN_RINGS || parts.length > MAX_PLAN_RINGS) return null;
  const whole = (text: string) => (/^\d{1,3}$/.test(text) ? Number(text) : -1);
  const plan = parts.map((part): MandalaRingSpec | null => {
    const [motif, repeat, size, color, band, accent, offset, ...extra] = part.split(".");
    const known = MOTIF_OPTIONS.find((m) => m === motif);
    const valid = known && extra.length === 0 && offset !== undefined && REPEAT_OPTIONS.includes(whole(repeat)) && whole(size) >= MIN_RING_SIZE && whole(size) <= MAX_RING_SIZE && whole(color) >= 0 && whole(color) < MAX_COLORS && (band === "x" || (whole(band) >= 0 && whole(band) < MAX_COLORS)) && /^[01]$/.test(accent) && /^[01]$/.test(offset);
    return valid ? { motif: known, repeat: whole(repeat), size: whole(size), color: whole(color), band: band === "x" ? null : whole(band), accent: accent === "1", offset: offset === "1" } : null;
  });
  return plan.every(Boolean) ? (plan as MandalaRingSpec[]) : null;
}

export function parseMandalaState(params: { get(name: string): string | null }, locale: Locale = "en"): MandalaRequest {
  const { ringPlan: basePlan, ...base } = defaultMandalaState(locale);
  const seed = params.get("seed");
  // A link marked as seeded, or naming a ring count or motif list, has no plan. Older links name the seed itself.
  const seeded = params.get("seeded") === "1" || seed !== null || params.get("r") !== null || params.get("m") !== null;
  const ringPlan = decodePlan(params.get("rs")) ?? (seeded ? null : basePlan);
  return {
    ...(locale === "en" ? {} : { locale }),
    symmetry: pick(params.get("n"), SYMMETRY_OPTIONS, base.symmetry),
    rings: pick(params.get("r"), RING_OPTIONS, base.rings),
    ...(ringPlan ? { ringPlan } : {}),
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
  // The seed itself stays out of the query: see `syncShareLink`.
  if (!state.ringPlan && state.rings === base.rings && state.motifs.join(".") === base.motifs.join(".")) params.set("seeded", "1");
  if (state.ringPlan && encodePlan(state.ringPlan) !== encodePlan(base.ringPlan!)) params.set("rs", encodePlan(state.ringPlan));
  if (state.lineWeight !== base.lineWeight) params.set("w", String(state.lineWeight));
  if (encodeColors(state.colors) !== encodeColors(base.colors)) params.set("k", encodeColors(state.colors));
  if (state.background !== base.background) params.set("bg", state.background.slice(1));
  if (state.outline !== base.outline) params.set("ol", state.outline.slice(1));
  return params.toString();
}
