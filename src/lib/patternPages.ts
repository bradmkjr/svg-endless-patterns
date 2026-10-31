import type { Locale } from "./generator";
import { messages, type Messages } from "./i18n";

export const PATTERN_SLUGS = ["celtic-knots", "girih", "tessellations", "tartans", "sashiko", "cross-stitch", "stained-glass"] as const;

type Slug = (typeof PATTERN_SLUGS)[number];

/** A planned tool's page. Its text lives with the rest of the site's translations. */
export type PatternPage = Messages["library"]["pages"][Slug] & { slug: Slug };

export function patternPages(locale: Locale = "en"): PatternPage[] {
  return PATTERN_SLUGS.map((slug) => ({ slug, ...messages(locale).library.pages[slug] }));
}

export function getPatternPage(slug: string, locale: Locale = "en"): PatternPage | undefined {
  return patternPages(locale).find((page) => page.slug === slug);
}
