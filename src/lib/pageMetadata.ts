import type { Metadata } from "next";
import type { Locale } from "./generator";
import { localePath, pageAlternates, SITE_LOCALES } from "./i18n";
import { absoluteUrl, SITE_NAME } from "./site";

export const CARD_SIZE = { width: 1200, height: 630 };

/** A page's share card's file name: "/mazes/circle/" is "mazes--circle". */
export const cardFile = (path: string) => path.split("/").filter(Boolean).join("--") || "home";

/** Where a page's share card is published. Each page has one per language, built in `app/og/`. */
export const cardUrl = (locale: Locale, path: string) => absoluteUrl(`/og/${locale}/${cardFile(path)}.png`);

/** The tags that name and share a page. A page's `openGraph` replaces its layout's, so this gives all of it. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string, openGraph: { type: "article"; publishedTime: string } | { type: "website" } = { type: "website" }): Metadata {
  const images = [{ url: cardUrl(locale, path), ...CARD_SIZE, alt: title }];
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: { ...openGraph, siteName: SITE_NAME, locale: SITE_LOCALES.find((l) => l.code === locale)!.ogLocale, url: absoluteUrl(localePath(locale, path)), title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
