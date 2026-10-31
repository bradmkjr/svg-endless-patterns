import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatternDetail, PatternLibrary } from "@/components/PatternLibrary";
import type { Locale } from "@/lib/generator";
import { fill, messages, pageAlternates } from "@/lib/i18n";
import { getPatternPage, PATTERN_SLUGS } from "@/lib/patternPages";

export function patternsMetadata(locale: Locale): Metadata {
  const t = messages(locale).library;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/patterns/") };
}

export function PatternsView({ locale }: { locale: Locale }) {
  return <PatternLibrary locale={locale} />;
}

export function patternSlugs() {
  return PATTERN_SLUGS.map((slug) => ({ slug }));
}

export function patternMetadata(locale: Locale, slug: string): Metadata {
  const page = getPatternPage(slug, locale);
  if (!page) return {};
  return {
    title: page.title,
    description: fill(messages(locale).library.detailDesc, page),
    alternates: pageAlternates(locale, `/patterns/${page.slug}/`),
    // Nothing to use here yet: remove when the tool ships, and add it to the sitemap.
    robots: { index: false, follow: true },
  };
}

export function PatternView({ locale, slug }: { locale: Locale; slug: string }) {
  const page = getPatternPage(slug, locale);
  if (!page) notFound();
  return <PatternDetail page={page} locale={locale} />;
}
