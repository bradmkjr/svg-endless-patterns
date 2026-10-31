import type { Craft, Locale, StitchInfo, StitchRequest } from "./generator";
import type { Messages } from "./i18n";

/** The stitch builder's options, starting gauges and share links. */

export type YarnWeight = {
  id: string;
  label: keyof Messages["weights"];
  /** Stitches and rows per 4" in stockinette. */
  knit: [number, number];
  needle: string;
  /** Stitches and rows per 4" in single crochet. */
  crochet: [number, number];
  hook: string;
};

/** Typical starting points by yarn weight. A swatch always overrides them. */
export const YARN_WEIGHTS: YarnWeight[] = [
  { id: "sport", label: "sport", knit: [24, 32], needle: "US 3–5", crochet: [18, 20], hook: "US E-4–7" },
  { id: "dk", label: "dk", knit: [22, 30], needle: "US 5–7", crochet: [16, 18], hook: "US 7–I-9" },
  { id: "worsted", label: "worsted", knit: [18, 24], needle: "US 7–9", crochet: [14, 16], hook: "US I-9–K-10½" },
  { id: "bulky", label: "bulky", knit: [14, 20], needle: "US 9–11", crochet: [11, 12], hook: "US K-10½–M-13" },
  { id: "super-bulky", label: "superBulky", knit: [10, 14], needle: "US 11–17", crochet: [8, 9], hook: "US M-13–Q" },
];

export const PROJECTS: { label: keyof Messages["projects"]; width: number; length: number }[] = [
  { label: "dishcloth", width: 8, length: 8 },
  { label: "scarf", width: 8, length: 60 },
  { label: "babyBlanket", width: 30, length: 36 },
  { label: "throw", width: 50, length: 60 },
];

export const WIDTH_OPTIONS = Array.from({ length: 77 }, (_, i) => i + 4);
export const LENGTH_OPTIONS = Array.from({ length: 97 }, (_, i) => i + 4);
export const STITCH_GAUGE_OPTIONS = Array.from({ length: 39 }, (_, i) => i + 6);
export const ROW_GAUGE_OPTIONS = Array.from({ length: 55 }, (_, i) => i + 4);

const clampRows = (value: number) => Math.min(58, Math.max(4, Math.round(value)));

/** Starting gauge for a stitch pattern in a yarn weight. */
export function startingGauge(stitch: StitchInfo, weight: YarnWeight): { stitchGauge: number; rowGauge: number } {
  const [stitches, rows] = stitch.craft === "knit" ? weight.knit : weight.crochet;
  return { stitchGauge: stitches, rowGauge: clampRows(rows * stitch.rowFactor) };
}

const DEFAULT_WEIGHT = YARN_WEIGHTS[2];
/** Default yarn color: drawn from each language's flag palette, as quilts are. */
const DEFAULT_COLORS: Record<Locale, string> = { en: "#23395d", es: "#aa151b", fr: "#0055a4", de: "#2b2b2b", pt: "#009b3a" };

export function defaultStitchState(stitch: StitchInfo, locale: Locale = "en"): StitchRequest {
  return { ...(locale === "en" ? {} : { locale }), width: 8, length: 8, color: DEFAULT_COLORS[locale], ...startingGauge(stitch, DEFAULT_WEIGHT) };
}

const HEX = /^[0-9a-f]{6}$/i;

function pick(raw: string | null, options: number[], fallback: number): number {
  const value = Number(raw);
  return raw !== null && options.includes(value) ? value : fallback;
}

export function parseStitchState(stitch: StitchInfo, params: { get(name: string): string | null }, locale: Locale = "en"): StitchRequest {
  const base = defaultStitchState(stitch, locale);
  const color = params.get("color");
  return {
    ...(locale === "en" ? {} : { locale }),
    width: pick(params.get("w"), WIDTH_OPTIONS, base.width),
    length: pick(params.get("l"), LENGTH_OPTIONS, base.length),
    stitchGauge: pick(params.get("sts"), STITCH_GAUGE_OPTIONS, base.stitchGauge),
    rowGauge: pick(params.get("rows"), ROW_GAUGE_OPTIONS, base.rowGauge),
    color: color && HEX.test(color) ? `#${color.toLowerCase()}` : base.color,
  };
}

export function serializeStitchState(stitch: StitchInfo, state: StitchRequest): string {
  const base = defaultStitchState(stitch, state.locale);
  const params = new URLSearchParams();
  if (state.width !== base.width) params.set("w", String(state.width));
  if (state.length !== base.length) params.set("l", String(state.length));
  if (state.stitchGauge !== base.stitchGauge) params.set("sts", String(state.stitchGauge));
  if (state.rowGauge !== base.rowGauge) params.set("rows", String(state.rowGauge));
  if (state.color !== base.color) params.set("color", state.color.slice(1));
  return params.toString();
}

export const CRAFT_PATHS: Record<Craft, string> = { knit: "/knitting", crochet: "/crochet" };
