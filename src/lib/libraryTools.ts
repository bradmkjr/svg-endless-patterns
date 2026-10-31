<<<<<<< ours
import type { Locale } from "./generator";
import { getBlocks, getStitchPatterns } from "./generator";
import { localePath, messages } from "./i18n";
import { serializeTartanState, defaultTartanState, TARTAN_PRESETS } from "./tartanState";
import { optionHref, thumbSrc, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";
import { optionLabels } from "./toolPages";
=======
import { generateCelticKnot, generateCrossStitch, generateGirih, generateMandala, generateNeedlepoint, generateSashiko, generateStainedGlass, generateTessellation, generateTruchet, type Locale } from "./generator";
import { defaultCelticKnotState } from "./celticKnotState";
import { defaultCrossStitchState } from "./crossStitchState";
import { defaultGirihState } from "./girihState";
import { defaultMandalaState } from "./mandalaState";
import { defaultNeedlepointState } from "./needlepointState";
import { defaultSashikoState } from "./sashikoState";
import { defaultStainedGlassState } from "./stainedGlassState";
import { defaultTessellationState } from "./tessellationState";
import { defaultTruchetState } from "./truchetState";
>>>>>>> theirs

/** One pattern shown under its type. */
export type LibrarySample = { name: string; href: string; src: string };
export type LibraryType = { id: string; title: string; text: string; output: string; explore: string; href: string; total: number; samples: LibrarySample[] };

<<<<<<< ours
/** How many patterns each type shows in the library. */
const SAMPLES_PER_TYPE = 6;

/** Patterns in the language's alphabetical order, with numbers in number order. */
function alphabetical<T extends { name: string }>(items: T[], locale: Locale): T[] {
  const order = new Intl.Collator(locale === "pt" ? "pt-BR" : locale, { numeric: true, sensitivity: "base" });
  return [...items].sort((a, b) => order.compare(a.name, b.name));
}

/** Every pattern type on the site, alphabetical by title, with its patterns alphabetical by name. */
export async function libraryTypes(locale: Locale): Promise<LibraryType[]> {
  const t = messages(locale).library;
  const toolText = t.tools as Record<string, { title: string; text: string; output: string; explore: string }>;
  const fromSlugs = (group: ThumbGroup, path: string, items: { slug: string; name: string }[]) => alphabetical(items, locale).map((item) => ({ name: item.name, href: localePath(locale, `${path}${item.slug}/`), src: thumbSrc(group, item.slug) }));
  const blocks = fromSlugs("blocks", "/blocks/", await getBlocks(locale));
  const knit = fromSlugs("knit", "/knitting/", await getStitchPatterns("knit", locale));
  const crochet = fromSlugs("crochet", "/crochet/", await getStitchPatterns("crochet", locale));
  const tartans = alphabetical(
    TARTAN_PRESETS.map((preset) => {
      const query = serializeTartanState({ ...defaultTartanState(locale), stripes: preset.stripes });
      return { name: messages(locale).tartan.presets[preset.id], href: `${localePath(locale, "/tartans/")}${query ? `?${query}` : ""}`, src: thumbSrc("tartan", preset.id) };
    }),
    locale,
  );
  const fixed: (Omit<LibraryType, "total" | "samples"> & { all: LibrarySample[] })[] = [
    { id: "quilt", title: t.quiltTitle, text: t.quiltText, output: t.quiltOutput, explore: t.exploreQuilt, href: localePath(locale, "/blocks/"), all: blocks },
    { id: "knit", title: t.knitTitle, text: t.knitText, output: t.knitOutput, explore: t.exploreKnit, href: localePath(locale, "/knitting/"), all: knit },
    { id: "crochet", title: t.crochetTitle, text: t.crochetText, output: t.crochetOutput, explore: t.exploreCrochet, href: localePath(locale, "/crochet/"), all: crochet },
    { id: "tartan", title: t.tartanTitle, text: t.tartanText, output: t.tartanOutput, explore: t.exploreTartan, href: localePath(locale, "/tartans/"), all: tartans },
=======
export async function libraryTools(locale: Locale): Promise<LibraryTool[]> {
  const [crossStitch, needlepoint, tessellation, sashiko, celtic, glass, mandala, girih, truchet] = await Promise.all([
    generateCrossStitch(defaultCrossStitchState(locale)),
    generateNeedlepoint(defaultNeedlepointState(locale)),
    generateTessellation(defaultTessellationState(locale)),
    generateSashiko({ ...defaultSashikoState(locale), width: 6, height: 6 }),
    generateCelticKnot(defaultCelticKnotState(locale)),
    generateStainedGlass(defaultStainedGlassState(locale)),
    generateMandala(defaultMandalaState(locale)),
    generateGirih(defaultGirihState(locale)),
    generateTruchet(defaultTruchetState(locale)),
  ]);
  return [
    { id: "crossStitch", href: "/cross-stitch/", svg: crossStitch.svg.stitched },
    { id: "needlepoint", href: "/needlepoint/", svg: needlepoint.svg.stitched },
    { id: "tessellation", href: "/tessellations/", tile: tessellation.svg.repeat },
    { id: "sashiko", href: "/sashiko/", svg: sashiko.svg.panel },
    { id: "celticKnot", href: "/celtic-knots/", svg: celtic.svg.art },
    { id: "stainedGlass", href: "/stained-glass/", svg: glass.svg.panel },
    { id: "mandala", href: "/mandalas/", svg: mandala.svg.art },
    // The girih repeat is wider than tall, so it's sized by height, two rows to a card.
    { id: "girih", href: "/girih/", tile: girih.svg.repeat, tileSize: "auto 50%" },
    { id: "truchet", href: "/truchet/", tile: truchet.svg.repeat, tileSize: "100% auto" },
>>>>>>> theirs
  ];
  const tools = await Promise.all(
    (Object.keys(TOOL_OPTIONS) as ToolId[]).map(async (tool) => {
      const labels = await optionLabels(tool, locale);
      const all = alphabetical(TOOL_OPTIONS[tool].options.map(({ slug }) => ({ name: labels[slug], href: optionHref(tool, locale, slug), src: thumbSrc(tool, slug) })), locale);
      return { id: tool, ...toolText[tool], href: localePath(locale, TOOL_OPTIONS[tool].path), all };
    }),
  );
  return alphabetical(
    [...fixed, ...tools].map(({ all, ...type }) => ({ ...type, name: type.title, total: all.length, samples: all.slice(0, SAMPLES_PER_TYPE) })),
    locale,
  );
}
