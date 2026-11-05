import type { KaleidoscopeMirrors, KaleidoscopeRequest, KaleidoscopeSource, Locale } from "./generator";
import { localeAccent } from "./localeAccent";

/** The kaleidoscope builder's options, defaults and share links. Seeds stay out of links, as in `toolOptions`. */

export const MIRROR_OPTIONS: KaleidoscopeMirrors[] = ["two-mirror", "square", "60-60-60", "45-45-90", "30-60-90"];
export const SEEDED_SOURCES: KaleidoscopeSource[] = ["beads", "shards", "ribbons"];
export const PATTERN_SOURCES: KaleidoscopeSource[] = ["truchet", "sashiko", "celtic-knot", "tessellation", "stained-glass", "quilt-block", "girih", "cross-stitch"];
export const SOURCE_OPTIONS: KaleidoscopeSource[] = [...SEEDED_SOURCES, ...PATTERN_SOURCES];
export const SEGMENT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 8];
export const MIN_ZOOM = 50;
export const MAX_ZOOM = 300;
export const MIN_OFFSET = -60;
export const MAX_OFFSET = 60;
export const MAX_COLORS = 6;
export const MAX_SEED = 999999;

/** The second color is the main one; the third is the one a language changes. */
const LOOK = { background: "#1d2b3a", colors: ["#d98e32", "#2f7f79", "#b8473d", "#7f9ab8", "#f4ecdc"] };

export const isTiling = (mirrors: KaleidoscopeMirrors) => mirrors !== "two-mirror";
export const isSeeded = (source: KaleidoscopeSource) => SEEDED_SOURCES.includes(source);

/** A whole degree from 0 to 359, whichever way round it was turned. */
export const normalAngle = (degrees: number) => ((Math.round(degrees) % 360) + 360) % 360;

export function defaultKaleidoscopeState(locale: Locale = "en"): KaleidoscopeRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    mirrors: "60-60-60",
    segments: 6,
    repeats: 4,
    source: "beads",
    seed: 7,
    angle: 0,
    zoom: 100,
    offsetX: 0,
    offsetY: 0,
    colors: LOOK.colors.map((color, i) => (i === 2 ? localeAccent(locale, color) : color)),
    background: LOOK.background,
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

/** A whole number in range, or the fallback. */
function whole(raw: string | null, min: number, max: number, fallback: number): number {
  if (raw === null || !/^-?\d{1,4}$/.test(raw)) return fallback;
  const n = Number(raw);
  return n >= min && n <= max ? n : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

function decodeColors(raw: string | null, fallback: string[]): string[] {
  if (raw === null) return fallback;
  const parts = raw.split(",");
  if (parts.length < 1 || parts.length > MAX_COLORS || !parts.every((part) => /^[0-9a-f]{6}$/i.test(part))) return fallback;
  return parts.map((part) => `#${part.toLowerCase()}`);
}

export function parseKaleidoscopeState(params: { get(name: string): string | null }, locale: Locale = "en"): KaleidoscopeRequest {
  const base = defaultKaleidoscopeState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    mirrors: pick(params.get("m"), MIRROR_OPTIONS, base.mirrors, (raw) => raw as KaleidoscopeMirrors),
    segments: pick(params.get("n"), SEGMENT_OPTIONS, base.segments, Number),
    repeats: pick(params.get("r"), REPEAT_OPTIONS, base.repeats, Number),
    source: pick(params.get("src"), SOURCE_OPTIONS, base.source, (raw) => raw as KaleidoscopeSource),
    seed: whole(params.get("seed"), 0, MAX_SEED, base.seed),
    angle: whole(params.get("a"), 0, 359, base.angle),
    zoom: whole(params.get("z"), MIN_ZOOM, MAX_ZOOM, base.zoom),
    offsetX: whole(params.get("x"), MIN_OFFSET, MAX_OFFSET, base.offsetX),
    offsetY: whole(params.get("y"), MIN_OFFSET, MAX_OFFSET, base.offsetY),
    colors: decodeColors(params.get("c"), base.colors),
    background: decodeColor(params.get("bg"), base.background),
  };
}

/** Share link settings, without defaults or the seed. */
export function serializeKaleidoscopeState(state: KaleidoscopeRequest): string {
  const base = defaultKaleidoscopeState(state.locale);
  const params = new URLSearchParams();
  if (state.mirrors !== base.mirrors) params.set("m", state.mirrors);
  if (state.segments !== base.segments) params.set("n", String(state.segments));
  if (state.repeats !== base.repeats) params.set("r", String(state.repeats));
  if (state.source !== base.source) params.set("src", state.source);
  if (state.angle !== base.angle) params.set("a", String(state.angle));
  if (state.zoom !== base.zoom) params.set("z", String(state.zoom));
  if (state.offsetX !== base.offsetX) params.set("x", String(state.offsetX));
  if (state.offsetY !== base.offsetY) params.set("y", String(state.offsetY));
  if (state.colors.join() !== base.colors.join()) params.set("c", state.colors.map((color) => color.slice(1)).join(","));
  if (state.background !== base.background) params.set("bg", state.background.slice(1));
  return params.toString();
}
