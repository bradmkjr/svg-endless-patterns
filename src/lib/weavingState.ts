import type { Locale, WeavingRequest, WeavingStripe, WeavingStructure } from "./generator";

/** The weaving builder's options, presets and share links. */

export type WeavingView = "cloth" | "draft";
/** The builder's settings: what the API draws, and which picture to show. */
export type WeavingState = WeavingRequest & { view: WeavingView };

export const STRUCTURE_OPTIONS: WeavingStructure[] = ["plain", "twill", "herringbone", "point-twill", "broken-twill", "satin", "basket", "huck", "overshot", "ms-and-os", "summer-and-winter", "rosepath"];
export const VIEW_OPTIONS: WeavingView[] = ["draft", "cloth"];
export const COUNT_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];
export const MAX_STRIPES = 12;

/** Shafts each structure is woven on, and its tie-ups on each, as the API offers them. The first is the default. */
const TWILL_TIEUPS: Record<number, string[]> = {
  4: ["2/2", "1/3", "3/1"],
  8: ["4/4", "1/7", "7/1", "3/1/1/3", "2/2/1/3"],
  16: ["8/8", "4/4/2/6", "5/3/3/5", "3/1/1/3/3/1/1/3"],
};
const STANDARD: Record<number, string[]> = { 4: ["standard"] };

export const STRUCTURES: Record<WeavingStructure, { tieUps: Record<number, string[]>; sizes: number[] }> = {
  plain: { tieUps: STANDARD, sizes: [1] },
  twill: { tieUps: TWILL_TIEUPS, sizes: [1] },
  herringbone: { tieUps: TWILL_TIEUPS, sizes: [1, 2, 3, 4] },
  "point-twill": { tieUps: TWILL_TIEUPS, sizes: [1, 2, 3, 4] },
  "broken-twill": { tieUps: { 4: TWILL_TIEUPS[4], 8: TWILL_TIEUPS[8] }, sizes: [1, 2, 3, 4] },
  satin: { tieUps: { 5: ["1/4", "4/1"], 8: ["1/7", "7/1"], 16: ["1/15", "15/1"] }, sizes: [1] },
  basket: { tieUps: STANDARD, sizes: [1, 2, 3] },
  huck: { tieUps: STANDARD, sizes: [1, 2, 3] },
  overshot: { tieUps: STANDARD, sizes: [1, 2, 3, 4] },
  "ms-and-os": { tieUps: STANDARD, sizes: [1, 2, 3] },
  "summer-and-winter": { tieUps: STANDARD, sizes: [1, 2, 3] },
  rosepath: { tieUps: { 4: TWILL_TIEUPS[4] }, sizes: [1] },
};

/** Named drafts the API knows, by the structure they belong to. */
export const NAMED_DRAFTS: Record<string, WeavingStructure> = { crowfoot: "broken-twill", oxford: "basket", "warp-rib": "basket", "monks-belt": "overshot", "bronson-lace": "huck" };

export const shaftOptions = (structure: WeavingStructure) => Object.keys(STRUCTURES[structure].tieUps).map(Number);
export const tieUpOptions = (structure: WeavingStructure, shafts: number) => STRUCTURES[structure].tieUps[shafts] ?? [];

/** Both primary colors: navy warp on a cream weft, in every language. */
export const WARP = "#23395d";
export const WEFT = "#f4ecdc";

/** A structure's own settings when it's chosen fresh. */
export function structureDefaults(structure: WeavingStructure): Pick<WeavingRequest, "shafts" | "size" | "tieUp"> {
  const shafts = shaftOptions(structure)[0];
  const { sizes } = STRUCTURES[structure];
  return { shafts, size: sizes.includes(2) ? 2 : sizes[0], tieUp: tieUpOptions(structure, shafts)[0] };
}

export function defaultWeavingState(locale: Locale = "en"): WeavingState {
  return {
    ...(locale === "en" ? {} : { locale }),
    structure: "twill",
    ...structureDefaults("twill"),
    warp: [{ color: WARP, count: 1 }],
    weft: [{ color: WEFT, count: 1 }],
    view: "draft",
  };
}

/** Settings the structure can't take fall back to its own, and a draft of another structure is dropped. */
export function normalizeWeaving(state: WeavingState): WeavingState {
  const defaults = structureDefaults(state.structure);
  const shafts = shaftOptions(state.structure).includes(state.shafts) ? state.shafts : defaults.shafts;
  const tieUps = tieUpOptions(state.structure, shafts);
  const rest = { ...state };
  delete rest.draft;
  return {
    ...rest,
    ...(state.draft && NAMED_DRAFTS[state.draft] === state.structure ? { draft: state.draft } : {}),
    shafts,
    tieUp: tieUps.includes(state.tieUp) ? state.tieUp : tieUps[0],
    size: STRUCTURES[state.structure].sizes.includes(state.size) ? state.size : defaults.size,
  };
}

/** What the API is asked for: everything but the view. */
export function weavingRequest(state: WeavingState): WeavingRequest {
  const request: WeavingRequest & { view?: WeavingView } = { ...state };
  delete request.view;
  return request;
}

const encodeStripes = (stripes: WeavingStripe[]) => stripes.map((s) => `${s.color.slice(1)}.${s.count}`).join("-");

function decodeStripes(raw: string | null): WeavingStripe[] | null {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length > MAX_STRIPES) return null;
  const stripes = parts.map((part) => {
    const [hex, count] = part.split(".");
    return /^[0-9a-f]{6}$/i.test(hex) && COUNT_OPTIONS.includes(Number(count)) ? { color: `#${hex.toLowerCase()}`, count: Number(count) } : null;
  });
  return stripes.every(Boolean) ? (stripes as WeavingStripe[]) : null;
}

/** "2/2" travels as "2-2", so a link reads cleanly. */
const encodeTieUp = (tieUp: string) => tieUp.replaceAll("/", "-");

export function parseWeavingState(params: { get(name: string): string | null }, locale: Locale = "en"): WeavingState {
  const base = defaultWeavingState(locale);
  const structure = STRUCTURE_OPTIONS.find((s) => s === params.get("s")) ?? base.structure;
  const defaults = structureDefaults(structure);
  const draft = params.get("d");
  return normalizeWeaving({
    ...(locale === "en" ? {} : { locale }),
    structure,
    ...(draft && Object.hasOwn(NAMED_DRAFTS, draft) ? { draft } : {}),
    shafts: Number(params.get("n") ?? defaults.shafts),
    size: Number(params.get("z") ?? defaults.size),
    tieUp: (params.get("t") ?? encodeTieUp(defaults.tieUp)).replaceAll("-", "/"),
    warp: decodeStripes(params.get("wp")) ?? base.warp,
    weft: decodeStripes(params.get("wf")) ?? base.weft,
    view: VIEW_OPTIONS.find((v) => v === params.get("v")) ?? base.view,
  });
}

export function serializeWeavingState(state: WeavingState): string {
  const base = defaultWeavingState(state.locale);
  const defaults = structureDefaults(state.structure);
  const params = new URLSearchParams();
  if (state.structure !== base.structure) params.set("s", state.structure);
  if (state.draft) params.set("d", state.draft);
  // A named draft has its own threading, so its structure's settings don't apply.
  if (!state.draft) {
    if (state.shafts !== defaults.shafts) params.set("n", String(state.shafts));
    if (state.size !== defaults.size) params.set("z", String(state.size));
    if (state.tieUp !== tieUpOptions(state.structure, state.shafts)[0]) params.set("t", encodeTieUp(state.tieUp));
  }
  if (encodeStripes(state.warp) !== encodeStripes(base.warp)) params.set("wp", encodeStripes(state.warp));
  if (encodeStripes(state.weft) !== encodeStripes(base.weft)) params.set("wf", encodeStripes(state.weft));
  if (state.view !== base.view) params.set("v", state.view);
  return params.toString();
}

const stripes = (...pairs: [string, number][]): WeavingStripe[] => pairs.map(([color, count]) => ({ color, count }));
const both = (...pairs: [string, number][]) => ({ warp: stripes(...pairs), weft: stripes(...pairs) });

const NAVY = "#23395d";
const CREAM = "#f4ecdc";
const RUST = "#b5533c";
const SLATE = "#7f9ab8";
const BLACK = "#1a1a1a";
const WHITE = "#f7f4ec";
const RED = "#a31621";
const GREEN = "#1f5c3d";
const GOLD = "#d9a441";
const GREY = "#6b7a8f";
const OAT = "#cbbd9f";
const PLUM = "#5b3a5e";
const TEAL = "#2a7f7a";

export type WeavingPreset = { id: string; structure: WeavingStructure } & Partial<Omit<WeavingRequest, "structure" | "locale">>;

/**
 * Traditional drafts and cloths, each built from its structure as Oelsner, Watson and Bronson
 * describe them. Names only: no catalog numbers. The same settings draw each thumbnail, in
 * the API's `engine/thumbs/weaving.json`.
 */
export const WEAVING_PRESETS: WeavingPreset[] = [
  { id: "birds-eye", structure: "point-twill", size: 1 },
  { id: "goose-eye", structure: "point-twill", size: 2, warp: stripes([RUST, 1]), weft: stripes([CREAM, 1]) },
  { id: "dornik", structure: "broken-twill", size: 2, warp: stripes([SLATE, 1]) },
  { id: "diamond-twill", structure: "point-twill", shafts: 8, size: 1, tieUp: "4/4", warp: stripes([PLUM, 1]) },
  { id: "chevron", structure: "herringbone", shafts: 8, size: 1, tieUp: "4/4", warp: stripes([TEAL, 1]) },
  { id: "herringbone-tweed", structure: "herringbone", size: 2, warp: stripes(["#3d3a36", 1]), weft: stripes(["#c8bfae", 1]) },
  { id: "crowfoot", structure: "broken-twill", draft: "crowfoot", warp: stripes([GREEN, 1]) },
  { id: "houndstooth", structure: "twill", ...both([BLACK, 4], [WHITE, 4]) },
  { id: "glen-check", structure: "twill", ...both([BLACK, 4], [WHITE, 4], [BLACK, 4], [WHITE, 4], [BLACK, 2], [WHITE, 2], [BLACK, 2], [WHITE, 2]) },
  { id: "buffalo-check", structure: "twill", ...both([RED, 24], [BLACK, 24]) },
  { id: "pinstripe", structure: "twill", warp: stripes([NAVY, 16], [WHITE, 1]), weft: stripes([NAVY, 1]) },
  { id: "windowpane", structure: "twill", ...both([GREY, 24], [WHITE, 2]) },
  { id: "log-cabin", structure: "plain", ...both([NAVY, 1], [CREAM, 1], [NAVY, 1], [CREAM, 1], [NAVY, 1], [CREAM, 2], [NAVY, 1], [CREAM, 1], [NAVY, 1], [CREAM, 1], [NAVY, 1]) },
  { id: "hairline", structure: "plain", ...both([BLACK, 1], [WHITE, 1]) },
  { id: "gingham", structure: "plain", ...both([RED, 8], [WHITE, 8]) },
  { id: "tattersall", structure: "plain", ...both([CREAM, 10], [RED, 2], [CREAM, 10], [GREEN, 2]) },
  { id: "color-gamp", structure: "plain", ...both([RED, 8], [GOLD, 8], [GREEN, 8], [TEAL, 8], [NAVY, 8], [PLUM, 8]) },
  { id: "hopsack", structure: "basket", size: 1, warp: stripes([OAT, 1]), weft: stripes([NAVY, 1]) },
  { id: "monks-cloth", structure: "basket", size: 3, warp: stripes([OAT, 1]), weft: stripes([CREAM, 1]) },
  { id: "oxford", structure: "basket", draft: "oxford", warp: stripes([SLATE, 1]), weft: stripes([WHITE, 1]) },
  { id: "warp-rib", structure: "basket", draft: "warp-rib", warp: stripes([RUST, 1]) },
  { id: "monks-belt", structure: "overshot", draft: "monks-belt", warp: stripes([CREAM, 1]), weft: stripes([RED, 1]) },
  { id: "huckaback", structure: "huck", size: 1, warp: stripes([WHITE, 1]), weft: stripes([SLATE, 1]) },
  { id: "huck-lace", structure: "huck", size: 2, warp: stripes([CREAM, 1]), weft: stripes([RUST, 1]) },
  { id: "bronson-lace", structure: "huck", draft: "bronson-lace", warp: stripes([CREAM, 1]), weft: stripes([NAVY, 1]) },
  { id: "sateen", structure: "satin", warp: stripes([NAVY, 1]), weft: stripes([GOLD, 1]) },
];

/** A preset's full settings, as the builder opens it. */
export function presetState(preset: WeavingPreset, locale: Locale = "en"): WeavingState {
  const patch: Partial<WeavingPreset> = { ...preset };
  delete patch.id;
  return normalizeWeaving({ ...defaultWeavingState(locale), ...structureDefaults(preset.structure), ...patch });
}
