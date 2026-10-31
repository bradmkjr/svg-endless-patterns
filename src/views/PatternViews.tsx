import type { Metadata } from "next";
import { PatternLibrary } from "@/components/PatternLibrary";
import type { Locale } from "@/lib/generator";
import { messages, pageAlternates } from "@/lib/i18n";

export function patternsMetadata(locale: Locale): Metadata {
  const t = messages(locale).library;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/patterns/") };
}

export function PatternsView({ locale }: { locale: Locale }) {
  return <PatternLibrary locale={locale} />;
}
