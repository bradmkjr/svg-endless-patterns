import de from "@/i18n/messages/de.json";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";
import { notFound } from "next/navigation";
import type { Locale } from "./generator";
import { absoluteUrl } from "./site";

export type Messages = typeof en;

export const MESSAGES: Record<Locale, Messages> = { en, es, fr, de, pt };

/** English keeps the site's original URLs; every other language sits under a prefix. */
export const SITE_LOCALES: { code: Locale; label: string; htmlLang: string; ogLocale: string }[] = [
  { code: "en", label: "English", htmlLang: "en", ogLocale: "en_US" },
  { code: "es", label: "Español", htmlLang: "es", ogLocale: "es_ES" },
  { code: "fr", label: "Français", htmlLang: "fr", ogLocale: "fr_FR" },
  { code: "de", label: "Deutsch", htmlLang: "de", ogLocale: "de_DE" },
  { code: "pt", label: "Português", htmlLang: "pt-BR", ogLocale: "pt_BR" },
];

export const PREFIXED_LOCALES = SITE_LOCALES.map((l) => l.code).filter((code) => code !== "en");

export function messages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/** A translated string with its {placeholders} filled in. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

const PREFIX = /^\/(es|fr|de|pt)(\/|$)/;

/** The same page without any language prefix. */
export function stripLocale(path: string): string {
  return path.replace(PREFIX, "/");
}

/** A site path in `locale`. A path that already names a language keeps it. */
export function localePath(locale: Locale, path: string): string {
  if (locale === "en" || PREFIX.test(path)) return path;
  return `/${locale}${path}`;
}

/** The language from a route parameter. Anything else isn't a page. */
export function routeLocale(raw: string): Locale {
  const code = SITE_LOCALES.find((l) => l.code === raw && l.code !== "en")?.code;
  if (!code) notFound();
  return code;
}

/** Canonical and hreflang links for a page, so search engines can pair the translations. */
export function pageAlternates(locale: Locale, path: string) {
  return {
    canonical: absoluteUrl(localePath(locale, path)),
    languages: {
      ...Object.fromEntries(SITE_LOCALES.map((l) => [l.htmlLang, absoluteUrl(localePath(l.code, path))])),
      "x-default": absoluteUrl(path),
    },
  };
}
