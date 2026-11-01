import type { Metadata } from "next";
import type { Locale } from "./generator";
import { localePath, pageAlternates, SITE_LOCALES } from "./i18n";
import { mazeApiUrl } from "./mazeApi";
import { absoluteUrl, SITE_NAME } from "./site";
import { TARTAN_PRESETS } from "./tartanState";
import { API_IMAGE_GROUPS, OPENING_OPTION, optionPath, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

export const CARD_SIZE = { width: 1200, height: 630 };
export type CardPicture = { group: ThumbGroup; slug: string };

/** The pattern a page's path is about, if it has one the API can draw. */
export function pathPicture(path: string): CardPicture | undefined {
  if (path === "/tartans/") return { group: "tartan", slug: TARTAN_PRESETS[0].id };
  for (const tool of Object.keys(TOOL_OPTIONS) as ToolId[]) {
    if (path === TOOL_OPTIONS[tool].path) return { group: tool, slug: OPENING_OPTION[tool] };
    const option = TOOL_OPTIONS[tool].options.find(({ slug }) => optionPath(tool, slug) === path);
    if (option) return { group: tool, slug: option.slug };
  }
  return undefined;
}

/** A share card on the API, drawn when it's asked for. Patterns it can't draw get its default card. */
export function cardUrl(picture?: CardPicture): string {
  return mazeApiUrl(picture && API_IMAGE_GROUPS.includes(picture.group) ? `/card/${picture.group}/${picture.slug}.png` : "/card/default.png");
}

type Options = { openGraph?: { type: "article"; publishedTime: string }; picture?: CardPicture };

/** The tags that name and share a page. A page's `openGraph` replaces its layout's, so this gives all of it. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string, { openGraph = undefined, picture = pathPicture(path) }: Options = {}): Metadata {
  const images = [{ url: cardUrl(picture), ...CARD_SIZE, alt: title }];
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: { type: "website", ...openGraph, siteName: SITE_NAME, locale: SITE_LOCALES.find((l) => l.code === locale)!.ogLocale, url: absoluteUrl(localePath(locale, path)), title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
