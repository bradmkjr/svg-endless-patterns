import catalog from "./patternCatalog.json";
import type { Locale, Setting } from "./generator";
import { localeAccent } from "./localeAccent";
import type { QuiltArrangement, QuiltBatting, QuiltQuilting, QuiltRequest } from "./quiltTypes";
import { BORDER_OPTIONS, COUNT_OPTIONS, PALETTES, SASHING_OPTIONS, SETTINGS, SIZE_OPTIONS, WOF_OPTIONS } from "./state";

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

/** Scrap baskets to start from: a warm one of rust, olive and gingham browns, and one of every blue. */
export const SCRAP_PALETTES: { id: "autumn" | "blues"; colors: string[]; border: string }[] = [
  { id: "autumn", colors: ["#c9b27a", "#8a4a2c", "#7d8a3c", "#2a2d3a", "#b5532f", "#6f7f5c"], border: "#5a4636" },
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

export function defaultQuiltState(locale: Locale = "en", design = DEFAULT_DESIGN): QuiltState {
  const { id, settings } = designOf(design);
  const { scraps, ...rest } = settings;
  return {
    ...(locale === "en" ? {} : { locale }),
    design: id,
    ...rest,
    blocks: [...rest.blocks],
    wof: 40,
    ...defaultColors(locale, scraps),
    seed: 7,
    showQuilting: true,
    batting: "cotton",
  };
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
  const base = defaultQuiltState(locale, pick(params.get("d"), DESIGN_IDS, DEFAULT_DESIGN, String));
  const seed = params.get("seed");
  return {
    ...(locale === "en" ? {} : { locale }),
    design: base.design,
    arrangement: pick(params.get("arr"), ARRANGEMENTS, base.arrangement, (raw) => raw as QuiltArrangement),
    blocks: decodeBlocks(params.get("a"), base.blocks),
    size: pick(params.get("size"), SIZE_OPTIONS, base.size, Number),
    cols: pick(params.get("cols"), COUNT_OPTIONS, base.cols, Number),
    rows: pick(params.get("rows"), COUNT_OPTIONS, base.rows, Number),
    sashing: pick(params.get("sash"), SASHING_OPTIONS, base.sashing, Number),
    border: pick(params.get("border"), BORDER_OPTIONS, base.border, Number),
    setting: pick(params.get("set"), SETTINGS, base.setting, (raw) => raw as Setting),
    wof: pick(params.get("wof"), WOF_OPTIONS, base.wof, Number),
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
  const base = defaultQuiltState(state.locale, state.design);
  const params = new URLSearchParams();
  if (state.design !== DEFAULT_DESIGN) params.set("d", state.design);
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

/** The colors a block's fabrics take in a quilt, so a block's own colors can open the quilt builder. */
export function paletteFromBlock(fabricIds: string[], colors: Record<string, string>): string[] {
  return fabricIds.map((id) => colors[id]).filter((c): c is string => !!c).slice(0, MAX_PALETTE);
}
