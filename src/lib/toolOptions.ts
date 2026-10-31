import celtic from "@/i18n/messages/celticKnot.json";
import crossStitch from "@/i18n/messages/crossStitch.json";
import girih from "@/i18n/messages/girih.json";
import glass from "@/i18n/messages/stainedGlass.json";
import mandala from "@/i18n/messages/mandala.json";
import sashiko from "@/i18n/messages/sashiko.json";
import truchet from "@/i18n/messages/truchet.json";
import { PATTERN_OPTIONS } from "./celticKnotState";
import { MOTIFS as STITCH_MOTIFS } from "./crossStitchState";
import type { Locale, TessellationOptions } from "./generator";
import { SYMMETRY_OPTIONS as GIRIH_SYMMETRY } from "./girihState";
import { fill, localePath } from "./i18n";
import { SYMMETRY_OPTIONS as MANDALA_SYMMETRY } from "./mandalaState";
import { MOTIF_OPTIONS as SASHIKO_MOTIFS } from "./sashikoState";
import { GLASS_LAYOUTS } from "./stainedGlassState";
import { publicPath } from "./site";
import { GROUPS } from "./tessellationState";
import { STYLE_OPTIONS } from "./truchetState";

/**
 * Each generator's main choice has its own page: `/truchet/chamfers/`. On those pages
 * the choice comes from the path, and every other setting stays in the query string.
 */

export type ToolId = "truchet" | "tessellation" | "girih" | "sashiko" | "celticKnot" | "stainedGlass" | "crossStitch" | "mandala";
type ToolOption = { slug: string; value: string };
type Tool = { path: string; param: string; options: ToolOption[] };

const named = (values: readonly string[]): ToolOption[] => values.map((value) => ({ slug: value, value }));
const folds = (values: readonly number[]): ToolOption[] => values.map((n) => ({ slug: `${n}-fold`, value: String(n) }));

export const TOOL_OPTIONS: Record<ToolId, Tool> = {
  truchet: { path: "/truchet/", param: "style", options: named(STYLE_OPTIONS) },
  tessellation: { path: "/tessellations/", param: "g", options: named(GROUPS) },
  girih: { path: "/girih/", param: "n", options: folds(GIRIH_SYMMETRY) },
  sashiko: { path: "/sashiko/", param: "m", options: named(SASHIKO_MOTIFS) },
  celticKnot: { path: "/celtic-knots/", param: "p", options: named(PATTERN_OPTIONS) },
  stainedGlass: { path: "/stained-glass/", param: "l", options: named(GLASS_LAYOUTS) },
  crossStitch: { path: "/cross-stitch/", param: "m", options: named(STITCH_MOTIFS.map((m) => m.id)) },
  mandala: { path: "/mandalas/", param: "n", options: folds(MANDALA_SYMMETRY) },
};

export const toolSlugs = (tool: ToolId) => TOOL_OPTIONS[tool].options.map((o) => ({ option: o.slug }));
export const isToolSlug = (tool: ToolId, slug: string) => TOOL_OPTIONS[tool].options.some((o) => o.slug === slug);

export function optionPath(tool: ToolId, slug: string): string {
  return `${TOOL_OPTIONS[tool].path}${slug}/`;
}

/** The share link settings with the page's choice added: the path outranks the query. */
export function withOption(tool: ToolId, slug: string | undefined, params: { toString(): string } = ""): URLSearchParams {
  const merged = new URLSearchParams(params.toString());
  const option = TOOL_OPTIONS[tool].options.find((o) => o.slug === slug);
  if (option) merged.set(TOOL_OPTIONS[tool].param, option.value);
  return merged;
}

/** The page for a value, or undefined if it has none. */
export function slugFor(tool: ToolId, value: string | number): string | undefined {
  return TOOL_OPTIONS[tool].options.find((o) => o.value === String(value))?.slug;
}

/** A link to a choice's page, carrying the current settings over. */
export function optionHref(tool: ToolId, locale: Locale, slug: string, search = ""): string {
  const params = new URLSearchParams(search);
  params.delete(TOOL_OPTIONS[tool].param);
  const query = params.toString();
  return `${localePath(locale, optionPath(tool, slug))}${query ? `?${query}` : ""}`;
}

/** Puts the settings in the address bar, leaving out the one the page's path already says. */
export function syncShareLink(query: string, tool: ToolId, slug: string | undefined) {
  const params = new URLSearchParams(query);
  if (slug) params.delete(TOOL_OPTIONS[tool].param);
  const next = params.toString();
  window.history.replaceState(window.history.state, "", next ? `?${next}` : window.location.pathname);
}

/**
 * Seeds stay out of URLs, where they'd make endless pages for search engines to
 * crawl. Each tool remembers its last seed in this browser instead.
 */
const seedKey = (tool: ToolId) => `endless-patterns:seed:${tool}`;

export function readSeed(raw: string | null): number | null {
  return raw && /^\d{1,6}$/.test(raw) ? Number(raw) : null;
}

export function rememberSeed(tool: ToolId, seed: number) {
  try {
    window.localStorage.setItem(seedKey(tool), String(seed));
  } catch {
    // Without storage the seed just isn't remembered.
  }
}

/** The remembered seed, unless the link names its own. Only called in the browser, after the static HTML. */
export function storedSeed(tool: ToolId, params: { get(name: string): string | null }): { seed: number } | undefined {
  if (params.get("seed") !== null) return undefined;
  try {
    const seed = readSeed(window.localStorage.getItem(seedKey(tool)));
    return seed === null ? undefined : { seed };
  } catch {
    return undefined;
  }
}

export type ThumbGroup = ToolId | "blocks" | "knit" | "crochet" | "tartan";

/** Where a thumbnail's static file is. */
export const thumbSrc = (group: ThumbGroup, slug: string) => publicPath(`/thumbs/${group}/${slug}.svg`);

type Tessellation = Pick<TessellationOptions, "groups">;

/** A choice's name. Tessellations take theirs from the engine, so pass their options. */
export function optionLabel(tool: ToolId, slug: string, locale: Locale, tessellation?: Tessellation): string {
  const value = TOOL_OPTIONS[tool].options.find((o) => o.slug === slug)?.value ?? slug;
  switch (tool) {
    case "truchet":
      return truchet[locale].styles[value as keyof (typeof truchet)["en"]["styles"]];
    case "tessellation":
      return `${value}: ${tessellation?.groups.find((g) => g.id === value)?.description ?? ""}`;
    case "girih":
      return value === "10" ? girih[locale].symmetryGirih : fill(girih[locale].symmetryStar, { n: value });
    case "sashiko":
      return sashiko[locale].motifs[value as keyof (typeof sashiko)["en"]["motifs"]];
    case "celticKnot":
      return celtic[locale].patterns[value as keyof (typeof celtic)["en"]["patterns"]];
    case "stainedGlass":
      return glass[locale].layouts[value as keyof (typeof glass)["en"]["layouts"]];
    case "crossStitch":
      return crossStitch[locale].motifs[value as keyof (typeof crossStitch)["en"]["motifs"]];
    case "mandala":
      return fill(mandala[locale].fold, { n: value });
  }
}
