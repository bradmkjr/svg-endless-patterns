import type { Metadata } from "next";
import type { Locale } from "./generator";
import { localePath, pageAlternates, SITE_LOCALES } from "./i18n";
import { mazeApiUrl } from "./mazeApi";
import { absoluteUrl, SITE_NAME } from "./site";
import { optionPath, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

export const CARD_SIZE = { width: 1200, height: 630 };
/** One pattern, or with `collection`, every pattern in its group: a category page's wall of its own patterns. */
export type CardPicture = { group: ThumbGroup; slug: string; collection?: false } | { group: ThumbGroup; collection: true };

/** Pages that list a whole group of patterns, and the group they list. */
const CATEGORY_PAGES: Record<string, ThumbGroup> = { "/blocks/": "blocks", "/knitting/": "knit", "/crochet/": "crochet", "/tartans/": "tartan" };

const CRAFT_PAGES: [RegExp, ThumbGroup][] = [
  [/^\/blocks\/([^/]+)\/$/, "blocks"],
  [/^\/knitting\/([^/]+)\/$/, "knit"],
  [/^\/crochet\/([^/]+)\/$/, "crochet"],
];

/** The pattern a page's path is about, if it has one. */
export function pathPicture(path: string): CardPicture | undefined {
  if (CATEGORY_PAGES[path]) return { group: CATEGORY_PAGES[path], collection: true };
  for (const tool of Object.keys(TOOL_OPTIONS) as ToolId[]) {
    // A maker's own page lists all its patterns, so its card shows all of them.
    if (path === TOOL_OPTIONS[tool].path) return { group: tool, collection: true };
    const option = TOOL_OPTIONS[tool].options.find(({ slug }) => optionPath(tool, slug) === path);
    if (option) return { group: tool, slug: option.slug };
  }
  for (const [page, group] of CRAFT_PAGES) {
    const slug = page.exec(path)?.[1];
    if (slug) return { group, slug };
  }
  return undefined;
}

/** A share card on the API, drawn when it's asked for, labeled with the kind of pattern in the page's language. Pages with no pattern get its default card. */
export function cardUrl(picture?: CardPicture, locale: Locale = "en"): string {
  if (!picture) return mazeApiUrl("/card/default.png");
  const lang = locale === "en" ? "" : `?lang=${locale}`;
  if (picture.collection) return mazeApiUrl(`/card/collection/${picture.group}.png${lang}`);
  return mazeApiUrl(`/card/${picture.group}/${picture.slug}.png${lang}`);
}

type Options = { openGraph?: { type: "article"; publishedTime: string }; picture?: CardPicture };

/** The tags that name and share a page. A page's `openGraph` replaces its layout's, so this gives all of it. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string, { openGraph = undefined, picture = pathPicture(path) }: Options = {}): Metadata {
  const images = [{ url: cardUrl(picture, locale), ...CARD_SIZE, alt: title }];
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: { type: "website", ...openGraph, siteName: SITE_NAME, locale: SITE_LOCALES.find((l) => l.code === locale)!.ogLocale, url: absoluteUrl(localePath(locale, path)), title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
