import type catalog from "@/i18n/messages/needlepoint.json";
import { colorsUsed, decodeColors, decodeGrid, encodeGrid, hex, pick, pickFinish, pickHex, sameGrid } from "./countedGrid";
import { defaultCrossStitchState, parseCrossStitchState } from "./crossStitchState";
import type { Locale, NeedlepointRequest, NeedlepointStitch, NeedlepointYarn } from "./generator";
import { DESIGNS } from "./needlepointDesigns";

export { colorsUsed, FINISH_OPTIONS, GRID_OPTIONS, MAX_COLORS, MAX_GRID, MIN_GRID, removeColor, resizeGrid, setCell } from "./countedGrid";

/** The needlepoint builder's options, designs and share links. */

export const MESH_OPTIONS = [10, 12, 13, 14, 18];
export const DEFAULT_MESH = 13;
export const STITCH_OPTIONS: NeedlepointStitch[] = ["basketweave", "continental", "tent"];
export const YARN_OPTIONS: NeedlepointYarn[] = ["tapestry", "persian"];
/** Unworked canvas on each side. Blocking pulls on it and finishing folds it, so it never drops below 2". */
export const MARGIN_OPTIONS = [2, 3, 4];
const DEFAULT_CANVAS = "#efe6d0";

export type NeedlepointDesignId = keyof typeof catalog.en.motifs;
export type NeedlepointDesign = { id: NeedlepointDesignId; grid: string[]; colors: string[] };

export const MOTIFS: NeedlepointDesign[] = DESIGNS;

const DEFAULT_DESIGN = MOTIFS[0];

/** One swatch of the opening design changes with the language; the rest stay as drawn. */
const LANGUAGE_SWATCH: Partial<Record<Locale, string>> = { es: "#aa151b", fr: "#0055a4", de: "#d00000", pt: "#009b3a" };
const SWATCH_INDEX = 2;

/** What a color takes when a hand-edited grid needs one that wasn't chosen. */
const SPARE_COLORS = ["#7a1f1f", "#3f6b5a", "#23395d", "#b8862b", "#6b4226", "#7a4b9a", "#2f8f9d", "#1a1a1a"];

/** A design's colors. Only the opening design varies by language. */
export function designColors(design: NeedlepointDesign, locale: Locale = "en"): string[] {
  const swatch = LANGUAGE_SWATCH[locale];
  if (design.id !== DEFAULT_DESIGN.id || !swatch) return design.colors;
  return design.colors.map((color, i) => (i === SWATCH_INDEX ? swatch : color));
}

const findDesign = (grid: string[]) => MOTIFS.find((design) => sameGrid(design.grid, grid));

/** The colors a grid has unless the share link says otherwise. */
function defaultColors(grid: string[], locale: Locale): string[] {
  const design = findDesign(grid);
  return design ? designColors(design, locale) : SPARE_COLORS.slice(0, Math.max(colorsUsed(grid), 1));
}

export function defaultNeedlepointState(locale: Locale = "en"): NeedlepointRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    grid: DEFAULT_DESIGN.grid,
    colors: designColors(DEFAULT_DESIGN, locale),
    canvas: DEFAULT_CANVAS,
    mesh: DEFAULT_MESH,
    stitch: "basketweave",
    yarn: "tapestry",
    margin: 3,
    finish: "pillow",
  };
}

function pickText<T extends string>(raw: string | null, options: readonly T[], fallback: T): T {
  return options.find((option) => option === raw) ?? fallback;
}

export function parseNeedlepointState(params: { get(name: string): string | null }, locale: Locale = "en"): NeedlepointRequest {
  const base = defaultNeedlepointState(locale);
  const grid = decodeGrid(params.get("g")) ?? MOTIFS.find((design) => design.id === params.get("m"))?.grid ?? base.grid;
  return {
    ...(locale === "en" ? {} : { locale }),
    grid,
    colors: decodeColors(params.get("c"), colorsUsed(grid)) ?? defaultColors(grid, locale),
    canvas: pickHex(params.get("f"), base.canvas),
    mesh: pick(params.get("mesh"), MESH_OPTIONS, base.mesh),
    stitch: pickText(params.get("stitch"), STITCH_OPTIONS, base.stitch),
    yarn: pickText(params.get("yarn"), YARN_OPTIONS, base.yarn),
    margin: pick(params.get("margin"), MARGIN_OPTIONS, base.margin),
    finish: pickFinish(params.get("finish"), base.finish),
  };
}

export function serializeNeedlepointState(state: NeedlepointRequest): string {
  const locale = state.locale ?? "en";
  const base = defaultNeedlepointState(locale);
  const params = new URLSearchParams();
  if (!sameGrid(state.grid, base.grid)) {
    const design = findDesign(state.grid);
    if (design) params.set("m", design.id);
    else params.set("g", encodeGrid(state.grid));
  }
  const encoded = state.colors.map(hex).join("-");
  if (encoded !== defaultColors(state.grid, locale).map(hex).join("-")) params.set("c", encoded);
  if (state.canvas !== base.canvas) params.set("f", hex(state.canvas));
  if (state.mesh !== base.mesh) params.set("mesh", String(state.mesh));
  if (state.stitch !== base.stitch) params.set("stitch", state.stitch);
  if (state.yarn !== base.yarn) params.set("yarn", state.yarn);
  if (state.margin !== base.margin) params.set("margin", String(state.margin));
  if (state.finish !== base.finish) params.set("finish", state.finish);
  return params.toString();
}

/**
 * Needlepoint used to be a setting on /cross-stitch/, and a static site can't redirect
 * old links. This turns such a link's settings into the query for /needlepoint/, or
 * gives null for any other link. A motif that page doesn't have travels as its grid and colors.
 */
export function legacyNeedlepointQuery(params: { get(name: string): string | null }, locale: Locale = "en"): string | null {
  if (params.get("craft") !== "needlepoint") return null;
  const old = parseCrossStitchState(params, locale);
  const base = defaultNeedlepointState(locale);
  return serializeNeedlepointState({
    ...base,
    grid: old.grid,
    colors: old.colors,
    canvas: old.fabric === defaultCrossStitchState(locale).fabric ? base.canvas : old.fabric,
    mesh: pick(params.get("count"), MESH_OPTIONS, base.mesh),
    margin: pick(params.get("margin"), MARGIN_OPTIONS, base.margin),
  });
}
