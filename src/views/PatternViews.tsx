import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { PatternLibrary } from "@/components/PatternLibrary";
import type { Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";

export function patternsMetadata(locale: Locale): Metadata {
  const t = messages(locale).library;
  return pageMetadata(locale, "/patterns/", t.metaTitle, t.metaDesc);
}

export function PatternsView({ locale }: { locale: Locale }) {
  return <PatternLibrary locale={locale} />;
}
