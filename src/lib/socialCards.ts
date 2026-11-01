import { getPosts } from "./content";
import { getBlocks, getStitchPatterns, type Locale } from "./generator";
import { messages } from "./i18n";
import { samplePicture } from "./postImages";
import { referenceText } from "./references";
import { SITE_NAME } from "./site";
import { TARTAN_PRESETS } from "./tartanState";
import { OPENING_OPTION, optionPath, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";
import { optionLabels } from "./toolPages";
import palettes from "@/i18n/messages/palettes.json";
import { THEME_GROUPS } from "./palettes";

/**
 * What each page's share card says and shows. All of its words are ones the site already
 * translates. `feature` is one pattern beside the text, `grid` a section's patterns beside
 * it, `wall` patterns behind it, and `palette` color bands behind it.
 */

export type CardPicture = { group: ThumbGroup; slug: string };
export type SocialCard = { title: string; kicker?: string; subtitle?: string } & ({ art: "feature" | "grid" | "wall"; pictures: CardPicture[] } | { art: "palette"; colors: string[][] });

const GRID = 9;

/** One pattern from every kind the site makes, for the pages about all of them. */
function wall(): CardPicture[] {
  const tools = (Object.keys(TOOL_OPTIONS) as ToolId[]).map((tool) => ({ group: tool as ThumbGroup, slug: OPENING_OPTION[tool] }));
  return [{ group: "blocks", slug: "log-cabin" }, ...tools.slice(0, 8), { group: "tartan", slug: TARTAN_PRESETS[0].id }, ...tools.slice(8)];
}

async function buildCards(locale: Locale): Promise<Map<string, SocialCard>> {
  const t = messages(locale);
  const library = t.library;
  const toolText = library.tools as Record<ToolId, { title: string; text: string; output: string }>;
  const pictures = wall();
  const cards = new Map<string, SocialCard>([
    ["/", { title: SITE_NAME, subtitle: t.meta.defaultTitle, art: "wall", pictures }],
    ["/patterns/", { title: library.h1, kicker: SITE_NAME, art: "wall", pictures }],
    ["/about/", { title: t.about.h1, kicker: SITE_NAME, art: "wall", pictures }],
    ["/acknowledgements/", { title: referenceText(locale).h1, kicker: SITE_NAME, art: "wall", pictures }],
    ["/blog/", { title: t.blog.h1, kicker: SITE_NAME, art: "wall", pictures }],
    ["/changelog/", { title: t.changelog.h1, kicker: SITE_NAME, art: "wall", pictures }],
    ["/palettes/", { title: palettes[locale].h1, kicker: SITE_NAME, art: "palette", colors: THEME_GROUPS.flatMap((group) => group.palettes.map((p) => p.colors)) }],
    ["/tartans/", { title: library.tartanTitle, subtitle: library.tartanText, art: "feature", pictures: [{ group: "tartan", slug: TARTAN_PRESETS[0].id }] }],
  ]);

  const section = (path: string, group: ThumbGroup, title: string, subtitle: string, items: { slug: string; name: string; summary: string }[]) => {
    cards.set(path, { title, subtitle, art: "grid", pictures: items.slice(0, GRID).map(({ slug }) => ({ group, slug })) });
    for (const item of items) cards.set(`${path}${item.slug}/`, { title: item.name, kicker: title, subtitle: item.summary, art: "feature", pictures: [{ group, slug: item.slug }] });
  };
  section("/blocks/", "blocks", library.quiltTitle, library.quiltText, await getBlocks(locale));
  section("/knitting/", "knit", library.knitTitle, library.knitText, await getStitchPatterns("knit", locale));
  section("/crochet/", "crochet", library.crochetTitle, library.crochetText, await getStitchPatterns("crochet", locale));

  for (const tool of Object.keys(TOOL_OPTIONS) as ToolId[]) {
    const text = toolText[tool];
    cards.set(TOOL_OPTIONS[tool].path, { title: text.title, subtitle: text.text, art: "feature", pictures: [{ group: tool, slug: OPENING_OPTION[tool] }] });
    const labels = await optionLabels(tool, locale);
    for (const { slug } of TOOL_OPTIONS[tool].options) cards.set(optionPath(tool, slug), { title: labels[slug], kicker: text.title, subtitle: text.output, art: "feature", pictures: [{ group: tool, slug }] });
  }

  for (const post of await getPosts(locale)) cards.set(`/blog/${post.slug}/`, { title: post.title, kicker: t.blog.h1, subtitle: post.summary, art: "feature", pictures: [samplePicture(post)] });
  return cards;
}

const built = new Map<Locale, Promise<Map<string, SocialCard>>>();

/** The card for a page's path, or undefined if there is no such page. */
export async function socialCard(locale: Locale, path: string): Promise<SocialCard | undefined> {
  if (!built.has(locale)) built.set(locale, buildCards(locale));
  return (await built.get(locale)!).get(path);
}
