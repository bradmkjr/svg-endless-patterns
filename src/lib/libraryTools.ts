import type { Locale } from "./generator";
import { getBlocks, getStitchPatterns } from "./patternCatalog";
import { localePath, messages } from "./i18n";
import { serializeTartanState, defaultTartanState, TARTAN_PRESETS } from "./tartanState";
import { optionHref, slugFor, thumbSrc, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";
import { seasonSamples, type Season } from "./seasons";
import { optionLabels } from "./toolPages";
import { stitchLabel } from "./stitchState";
import { weavingDraftLinks } from "./weavingDrafts";

/** One pattern shown under its type. `seasonal`: it's in the season that's on now. */
export type LibrarySample = { name: string; href: string; src: string; seasonal?: boolean };
/** `inSeason`: every one of its designs in the season that's on, whether or not it's among `samples`. */
export type LibraryType = { id: string; title: string; text: string; output: string; explore: string; href: string; total: number; samples: LibrarySample[]; inSeason: LibrarySample[] };

/** How many patterns each type shows in the library. */
const SAMPLES_PER_TYPE = 6;

/** Patterns in the language's alphabetical order, with numbers in number order. */
function alphabetical<T extends { name: string }>(items: T[], locale: Locale): T[] {
  const order = new Intl.Collator(locale === "pt" ? "pt-BR" : locale, { numeric: true, sensitivity: "base" });
  return [...items].sort((a, b) => order.compare(a.name, b.name));
}

/** The pattern types that aren't builders with option pages: each has a page of its own. */
const FIXED_TYPES = [
  { id: "quilt", title: "quiltTitle", path: "/blocks/" },
  { id: "knit", title: "knitTitle", path: "/knitting/" },
  { id: "crochet", title: "crochetTitle", path: "/crochet/" },
  { id: "tartan", title: "tartanTitle", path: "/tartans/" },
] as const;

export type PatternTypeLink = { id: string; title: string; href: string };

/**
 * Every pattern type's name and page, alphabetical in the language: the site menu's list.
 * The same types as the library, without their samples, so it costs nothing to build.
 */
export function patternTypeLinks(locale: Locale): PatternTypeLink[] {
  const t = messages(locale).library;
  const toolText = t.tools as Record<string, { title: string }>;
  const order = new Intl.Collator(locale === "pt" ? "pt-BR" : locale, { numeric: true, sensitivity: "base" });
  return [
    ...FIXED_TYPES.map(({ id, title, path }) => ({ id, title: t[title], href: localePath(locale, path) })),
    ...(Object.keys(TOOL_OPTIONS) as ToolId[]).map((tool) => ({ id: tool, title: toolText[tool].title, href: localePath(locale, TOOL_OPTIONS[tool].path) })),
  ].sort((a, b) => order.compare(a.title, b.title));
}

/**
 * The library pages of a season's designs: every sample in the collection that is a design with a
 * page of its own, such as a cross-stitch chart, a quilt block or an origami model. Samples that
 * only recolor a tool's opening design name none, and are left out.
 */
export function seasonalHrefs(season: Season, locale: Locale): Set<string> {
  const hrefs = new Set<string>();
  for (const sample of seasonSamples(season)) {
    const params = new URLSearchParams(sample.query);
    if (sample.kind === "block") hrefs.add(localePath(locale, `/blocks/${sample.slug}/`));
    else if (sample.kind === "knit") hrefs.add(localePath(locale, `/knitting/${sample.slug}/`));
    else if (sample.kind === "crochet") hrefs.add(localePath(locale, `/crochet/${sample.slug}/`));
    // A maze or puzzle sample is its own message or grid, which the library's picture of that kind doesn't show.
    else if (sample.kind !== "maze" && sample.kind !== "puzzle") {
      const tool = (sample.kind === "celtic" ? "celticKnot" : sample.kind) as ToolId;
      if (!(tool in TOOL_OPTIONS)) continue;
      const value = params.get(TOOL_OPTIONS[tool].param);
      const slug = sample.slug || (value === null ? undefined : slugFor(tool, value));
      if (slug) hrefs.add(optionHref(tool, locale, slug));
    }
  }
  return hrefs;
}

/**
 * Every pattern type on the site, alphabetical by title, with its patterns alphabetical by name.
 * While a season is on, its designs come first in each type and are marked, for the library to
 * show them up front.
 */
export async function libraryTypes(locale: Locale, season: Season | undefined = undefined): Promise<LibraryType[]> {
  const inSeason = season ? seasonalHrefs(season, locale) : new Set<string>();
  const seasonFirst = (items: LibrarySample[]): LibrarySample[] => {
    const marked = items.map((item) => (inSeason.has(item.href) ? { ...item, seasonal: true } : item));
    return [...marked.filter((item) => item.seasonal), ...marked.filter((item) => !item.seasonal)];
  };
  const t = messages(locale).library;
  const toolText = t.tools as Record<string, { title: string; text: string; output: string; explore: string }>;
  const fromSlugs = (group: ThumbGroup, path: string, items: { slug: string; name: string }[]) => alphabetical(items, locale).map((item) => ({ name: item.name, href: localePath(locale, `${path}${item.slug}/`), src: thumbSrc(group, item.slug) }));
  const blocks = fromSlugs("blocks", "/blocks/", await getBlocks(locale));
  const knit = fromSlugs("knit", "/knitting/", await getStitchPatterns("knit", locale));
  const crochet = fromSlugs("crochet", "/crochet/", (await getStitchPatterns("crochet", locale)).map((stitch) => ({ ...stitch, name: stitchLabel(stitch) })));
  const tartans = alphabetical(
    TARTAN_PRESETS.map((preset) => {
      const query = serializeTartanState({ ...defaultTartanState(locale), stripes: preset.stripes });
      return { name: messages(locale).tartan.presets[preset.id], href: `${localePath(locale, "/tartans/")}${query ? `?${query}` : ""}`, src: thumbSrc("tartan", preset.id) };
    }),
    locale,
  );
  const fixed: (Omit<LibraryType, "total" | "samples" | "inSeason"> & { all: LibrarySample[] })[] = [
    { id: "quilt", title: t.quiltTitle, text: t.quiltText, output: t.quiltOutput, explore: t.exploreQuilt, href: localePath(locale, "/blocks/"), all: blocks },
    { id: "knit", title: t.knitTitle, text: t.knitText, output: t.knitOutput, explore: t.exploreKnit, href: localePath(locale, "/knitting/"), all: knit },
    { id: "crochet", title: t.crochetTitle, text: t.crochetText, output: t.crochetOutput, explore: t.exploreCrochet, href: localePath(locale, "/crochet/"), all: crochet },
    { id: "tartan", title: t.tartanTitle, text: t.tartanText, output: t.tartanOutput, explore: t.exploreTartan, href: localePath(locale, "/tartans/"), all: tartans },
  ];
  const tools = await Promise.all(
    (Object.keys(TOOL_OPTIONS) as ToolId[]).map(async (tool) => {
      const labels = await optionLabels(tool, locale);
      const options = TOOL_OPTIONS[tool].options.map(({ slug }) => ({ name: labels[slug], href: optionHref(tool, locale, slug), src: thumbSrc(tool, slug) }));
      // Weaving's traditional drafts sit beside its structures.
      const extra = tool === "weaving" ? weavingDraftLinks(locale).map(({ name, href, src }) => ({ name, href, src })) : [];
      const all = alphabetical([...options, ...extra], locale);
      return { id: tool, ...toolText[tool], href: localePath(locale, TOOL_OPTIONS[tool].path), all };
    }),
  );
  return alphabetical(
    [...fixed, ...tools].map(({ all, ...type }) => {
      const ordered = seasonFirst(all);
      return { ...type, name: type.title, total: all.length, samples: ordered.slice(0, SAMPLES_PER_TYPE), inSeason: ordered.filter((item) => item.seasonal) };
    }),
    locale,
  );
}
