import catalog from "./patternCatalog.json";
import type { BlockInfo, Locale, PatternRequest, Setting } from "./generator";
import { localePath } from "./i18n";
import { localeAccent } from "./localeAccent";
import type { QuiltArrangement, QuiltBatting, QuiltQuilting, QuiltRequest } from "./quiltTypes";
import { COUNT_OPTIONS, PALETTES, SETTINGS } from "./state";
import { convertLength, convertWof, defaultUnits, MEASURES, readUnits, type Units } from "./units";

/**
 * The quilt builder's designs, defaults and share links. A design is a common way to put
 * blocks together; every setting it picks can still be changed, and the link says only what
 * differs from the design.
 */

export const PLAIN = "plain";
export const BLOCK_CHOICES = [PLAIN, ...catalog.blocks.en.map((block) => block.slug)];
export const ARRANGEMENTS: QuiltArrangement[] = ["repeat", "alternate", "sampler"];
export const QUILTING_OPTIONS: QuiltQuilting[] = ["stipple", "meander", "crosshatch", "outline", "ditch", "none"];
export const BATTING_OPTIONS: QuiltBatting[] = ["cotton", "polyester", "none"];
export const NOISE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const MAX_SAMPLER_BLOCKS = 12;
export const MIN_PALETTE = 2;
export const MAX_PALETTE = 6;
export const MAX_SEED = 999999;

export type ScrapBasketId = "spring" | "summer" | "autumn" | "winter" | "monochrome" | "blues";

/**
 * Scrap baskets to start from: the four seasons, a monochrome, and every blue. Like every
 * palette on the site, each starts with a light ground and then its main color.
 */
export const SCRAP_PALETTES: { id: ScrapBasketId; colors: string[]; border: string }[] = [
  { id: "spring", colors: ["#f6f1e1", "#6f9a5b", "#e8a0b4", "#f2d16b", "#9cc3e0", "#b9a3d6"], border: "#4f7a44" },
  { id: "summer", colors: ["#fdf6e3", "#1f7a8c", "#f26b4f", "#ffc93c", "#7cc6a4", "#e85d8a"], border: "#1f5f6e" },
  { id: "autumn", colors: ["#c9b27a", "#8a4a2c", "#7d8a3c", "#2a2d3a", "#b5532f", "#6f7f5c"], border: "#5a4636" },
  { id: "winter", colors: ["#eef2f5", "#2b3a55", "#8a1c2b", "#5d7f73", "#b8c4d0", "#c9a86a"], border: "#1e2a3d" },
  { id: "monochrome", colors: ["#f4f4f2", "#2b2b2b", "#6e6e6e", "#a8a8a8", "#d4d4d2", "#111111"], border: "#1a1a1a" },
  { id: "blues", colors: ["#9fb6d9", "#1f3f8f", "#2a7fb8", "#1d2a5c", "#3b6fd1", "#2e6f78"], border: "#1d2a5c" },
];

type DesignSettings = Pick<QuiltRequest, "arrangement" | "blocks" | "size" | "cols" | "rows" | "sashing" | "border" | "setting" | "noise" | "scrappy" | "quilting"> & { scraps?: (typeof SCRAP_PALETTES)[number]["id"] };

/** Classic ways to put blocks together, each its own page. */
export const DESIGNS: { id: string; settings: DesignSettings }[] = [
  { id: "snowball-and-nine-patch", settings: { arrangement: "alternate", blocks: ["nine-patch", "snowball"], size: 9, cols: 7, rows: 9, sashing: 0, border: 4, setting: "straight", noise: 0, scrappy: false, quilting: "stipple" } },
  { id: "ohio-star-and-plain", settings: { arrangement: "alternate", blocks: ["ohio-star", PLAIN], size: 12, cols: 5, rows: 7, sashing: 0, border: 4, setting: "straight", noise: 0, scrappy: false, quilting: "meander" } },
  { id: "double-irish-chain", settings: { arrangement: "repeat", blocks: ["double-irish-chain"], size: 10, cols: 6, rows: 8, sashing: 0, border: 4, setting: "straight", noise: 0, scrappy: false, quilting: "crosshatch" } },
  { id: "log-cabin-quarters", settings: { arrangement: "repeat", blocks: ["log-cabin"], size: 10.5, cols: 6, rows: 8, sashing: 0, border: 3, setting: "quadrants", noise: 30, scrappy: false, quilting: "ditch" } },
  { id: "churn-dash-sashed", settings: { arrangement: "repeat", blocks: ["churn-dash"], size: 9, cols: 6, rows: 7, sashing: 2, border: 4, setting: "straight", noise: 40, scrappy: false, quilting: "outline" } },
  { id: "star-sampler", settings: { arrangement: "sampler", blocks: ["sawtooth-star", "ohio-star", "variable-star", "friendship-star", "lemoyne-star", "card-trick"], size: 12, cols: 4, rows: 5, sashing: 2, border: 4, setting: "straight", noise: 20, scrappy: false, quilting: "stipple" } },
  { id: "charm-squares", settings: { arrangement: "repeat", blocks: ["checkerboard"], size: 10, cols: 6, rows: 7, sashing: 0, border: 3, setting: "straight", noise: 70, scrappy: true, quilting: "meander", scraps: "autumn" } },
  { id: "scrappy-pinwheels", settings: { arrangement: "repeat", blocks: ["pinwheel"], size: 8, cols: 7, rows: 9, sashing: 0, border: 3, setting: "straight", noise: 50, scrappy: true, quilting: "meander", scraps: "summer" } },
  { id: "rail-fence-turned", settings: { arrangement: "repeat", blocks: ["rail-fence"], size: 6, cols: 10, rows: 12, sashing: 0, border: 3, setting: "alternate", noise: 0, scrappy: false, quilting: "ditch", scraps: "winter" } },
  { id: "hearts-and-plain", settings: { arrangement: "alternate", blocks: ["heart", PLAIN], size: 9, cols: 7, rows: 9, sashing: 0, border: 4, setting: "straight", noise: 0, scrappy: false, quilting: "stipple", scraps: "spring" } },
  { id: "bow-ties-turned", settings: { arrangement: "repeat", blocks: ["bow-tie"], size: 6, cols: 10, rows: 12, sashing: 0, border: 3, setting: "alternate", noise: 0, scrappy: false, quilting: "outline", scraps: "monochrome" } },
  { id: "trip-around-the-world", settings: { arrangement: "repeat", blocks: ["trip-around-the-world"], size: 14, cols: 4, rows: 5, sashing: 0, border: 3, setting: "straight", noise: 0, scrappy: false, quilting: "crosshatch" } },
];
export const DESIGN_IDS = DESIGNS.map((design) => design.id);
export const DEFAULT_DESIGN = DESIGN_IDS[0]!;

/** Settings a design picks, which don't carry over to another design's page. Colors and finishing do. */
export const DESIGN_PARAMS = ["a", "arr", "size", "cols", "rows", "sash", "border", "set", "noise", "scrap", "q"];

export type QuiltState = QuiltRequest & { design: string };

const designOf = (id: string) => DESIGNS.find((design) => design.id === id) ?? DESIGNS[0]!;

/** Each language's colors: the site's first palette with its secondary color swapped, as the block builder does. */
function defaultColors(locale: Locale, scraps?: DesignSettings["scraps"]) {
  const basket = SCRAP_PALETTES.find((p) => p.id === scraps);
  if (basket) return { palette: [...basket.colors], sashingColor: basket.colors[0]!, borderColor: basket.border, thread: "#efe6d2" };
  const { colors, sashing, border } = PALETTES[0];
  return { palette: colors.map((color, i) => (i === 2 ? localeAccent(locale, color) : color)), sashingColor: sashing, borderColor: border, thread: "#cfc6b2" };
}

/** Each block's grid, so a metric size can be chosen where every block cuts on the ruler's marks. */
export const gridOf = (slug: string) => (slug === PLAIN ? 1 : (catalog.blocks.en.find((block) => block.slug === slug)?.grid ?? 1));

/** Inches are the API's default, so a request names its units only when they're metric. */
const unitsField = (units: Units) => (units === "in" ? {} : { units });

/** Lengths in other units: each at the nearest choice there, a block size where every block cuts on the marks. */
function convertLayout<T extends Pick<QuiltRequest, "blocks" | "size" | "sashing" | "border">>(layout: T, from: Units, to: Units): T {
  if (from === to) return layout;
  const m = MEASURES[to];
  return {
    ...layout,
    size: convertLength(layout.size, from, to, m.size, layout.blocks.map(gridOf)),
    sashing: convertLength(layout.sashing, from, to, m.sashing),
    border: convertLength(layout.border, from, to, m.border),
  };
}

/** A design's own settings are in inches; in metric each length converts to its nearest metric choice. */
export function defaultQuiltState(locale: Locale = "en", design = DEFAULT_DESIGN, units: Units = defaultUnits(locale)): QuiltState {
  const { id, settings } = designOf(design);
  const { scraps, ...rest } = convertLayout(settings, "in", units);
  return {
    ...(locale === "en" ? {} : { locale }),
    ...unitsField(units),
    design: id,
    ...rest,
    blocks: [...rest.blocks],
    wof: MEASURES[units].wof0,
    ...defaultColors(locale, scraps),
    seed: 7,
    showQuilting: true,
    batting: "cotton",
  };
}

/** Whether the quilt is still its design's blocks in its design's arrangement, or has become its own. */
export function followsDesign(state: Pick<QuiltState, "design" | "arrangement" | "blocks">): boolean {
  const { settings } = designOf(state.design);
  return state.arrangement === settings.arrangement && state.blocks.join(".") === settings.blocks.join(".");
}

/** What the API is sent: the state without the design's name. */
export function quiltRequest(state: QuiltState): QuiltRequest {
  const request: Partial<QuiltState> = { ...state };
  delete request.design;
  return request as QuiltRequest;
}

const HEX = /^[0-9a-f]{6}$/i;

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && HEX.test(raw) ? `#${raw.toLowerCase()}` : fallback);
const decodeFlag = (raw: string | null, fallback: boolean) => (raw === "1" ? true : raw === "0" ? false : fallback);
const flag = (value: boolean) => (value ? "1" : "0");

function decodeBlocks(raw: string | null, fallback: string[]): string[] {
  if (raw === null) return fallback;
  const slugs = raw.split(".").filter((slug) => BLOCK_CHOICES.includes(slug)).slice(0, MAX_SAMPLER_BLOCKS);
  return slugs.length ? slugs : fallback;
}

function decodePalette(raw: string | null, fallback: string[]): string[] {
  if (raw === null) return fallback;
  const colors = raw.split("-");
  return colors.length >= MIN_PALETTE && colors.length <= MAX_PALETTE && colors.every((c) => HEX.test(c)) ? colors.map((c) => `#${c.toLowerCase()}`) : fallback;
}

/** The state a link describes. The design comes first, from `d`, and the rest is read against it. */
export function parseQuiltState(params: { get(name: string): string | null }, locale: Locale = "en"): QuiltState {
  const units = readUnits(params.get("units"), locale);
  const m = MEASURES[units];
  const base = defaultQuiltState(locale, pick(params.get("d"), DESIGN_IDS, DEFAULT_DESIGN, String), units);
  const seed = params.get("seed");
  return {
    ...(locale === "en" ? {} : { locale }),
    ...unitsField(units),
    design: base.design,
    arrangement: pick(params.get("arr"), ARRANGEMENTS, base.arrangement, (raw) => raw as QuiltArrangement),
    blocks: decodeBlocks(params.get("a"), base.blocks),
    size: pick(params.get("size"), m.size, base.size, Number),
    cols: pick(params.get("cols"), COUNT_OPTIONS, base.cols, Number),
    rows: pick(params.get("rows"), COUNT_OPTIONS, base.rows, Number),
    sashing: pick(params.get("sash"), m.sashing, base.sashing, Number),
    border: pick(params.get("border"), m.border, base.border, Number),
    setting: pick(params.get("set"), SETTINGS, base.setting, (raw) => raw as Setting),
    wof: pick(params.get("wof"), m.wof, base.wof, Number),
    palette: decodePalette(params.get("p"), base.palette),
    sashingColor: decodeColor(params.get("sc"), base.sashingColor),
    borderColor: decodeColor(params.get("bc"), base.borderColor),
    noise: pick(params.get("noise"), NOISE_OPTIONS, base.noise, Number),
    scrappy: decodeFlag(params.get("scrap"), base.scrappy),
    seed: seed && /^\d{1,6}$/.test(seed) ? Number(seed) : base.seed,
    quilting: pick(params.get("q"), QUILTING_OPTIONS, base.quilting, (raw) => raw as QuiltQuilting),
    showQuilting: decodeFlag(params.get("lines"), base.showQuilting),
    thread: decodeColor(params.get("th"), base.thread),
    batting: pick(params.get("bat"), BATTING_OPTIONS, base.batting, (raw) => raw as QuiltBatting),
  };
}

/** The query for a state: only what differs from its design. Seeds stay out, as on every tool; this browser remembers them. */
export function serializeQuiltState(state: QuiltState): string {
  const units = state.units ?? "in";
  const base = defaultQuiltState(state.locale, state.design, units);
  const params = new URLSearchParams();
  if (state.design !== DEFAULT_DESIGN) params.set("d", state.design);
  if (units !== defaultUnits(state.locale)) params.set("units", units);
  if (state.arrangement !== base.arrangement) params.set("arr", state.arrangement);
  if (state.blocks.join(".") !== base.blocks.join(".")) params.set("a", state.blocks.join("."));
  if (state.size !== base.size) params.set("size", String(state.size));
  if (state.cols !== base.cols) params.set("cols", String(state.cols));
  if (state.rows !== base.rows) params.set("rows", String(state.rows));
  if (state.sashing !== base.sashing) params.set("sash", String(state.sashing));
  if (state.border !== base.border) params.set("border", String(state.border));
  if (state.setting !== base.setting) params.set("set", state.setting);
  if (state.wof !== base.wof) params.set("wof", String(state.wof));
  if (state.palette.join() !== base.palette.join()) params.set("p", state.palette.map((c) => c.slice(1)).join("-"));
  if (state.sashingColor !== base.sashingColor) params.set("sc", state.sashingColor.slice(1));
  if (state.borderColor !== base.borderColor) params.set("bc", state.borderColor.slice(1));
  if (state.noise !== base.noise) params.set("noise", String(state.noise));
  if (state.scrappy !== base.scrappy) params.set("scrap", flag(state.scrappy));
  if (state.quilting !== base.quilting) params.set("q", state.quilting);
  if (state.showQuilting !== base.showQuilting) params.set("lines", flag(state.showQuilting));
  if (state.thread !== base.thread) params.set("th", state.thread.slice(1));
  if (state.batting !== base.batting) params.set("bat", state.batting);
  return params.toString();
}

/**
 * A block builder's design as a quilt: that block, repeated, in its colors and layout. Its fabrics
 * become the palette in their own order, so each keeps its color, and the block's size, counts,
 * sashing, border, direction and fabric width all carry over.
 */
export function quiltFromBlock(block: Pick<BlockInfo, "slug" | "fabrics">, request: PatternRequest): QuiltState {
  const locale = request.locale ?? "en";
  const units = request.units ?? "in";
  return {
    ...defaultQuiltState(locale, DEFAULT_DESIGN, units),
    arrangement: "repeat",
    blocks: [block.slug],
    size: request.size,
    cols: request.cols,
    rows: request.rows,
    sashing: request.sashing,
    border: request.border,
    setting: request.setting,
    wof: request.wof,
    palette: block.fabrics.map((fabric) => request.colors[fabric.id]!).slice(0, MAX_PALETTE),
    sashingColor: request.colors.sashing!,
    borderColor: request.colors.border!,
  };
}

/** The quilt planner's link for a block builder's design, in the block builder's language. */
export function quiltHrefFromBlock(block: Pick<BlockInfo, "slug" | "fabrics">, request: PatternRequest): string {
  const query = serializeQuiltState(quiltFromBlock(block, request));
  return `${localePath(request.locale ?? "en", "/quilts/")}${query ? `?${query}` : ""}`;
}

/** The same quilt in the other units. */
export function quiltWithUnits(state: QuiltState, units: Units): QuiltState {
  const from = state.units ?? "in";
  if (from === units) return state;
  const rest: QuiltState = { ...convertLayout(state, from, units) };
  delete rest.units;
  return { ...rest, ...unitsField(units), wof: convertWof(state.wof, from, units) };
}
