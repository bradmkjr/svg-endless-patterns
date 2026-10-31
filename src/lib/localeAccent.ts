import type { Locale } from "./generator";

/**
 * A language changes one secondary color, loosely drawn from a flag commonly
 * associated with it. Primary colors stay the same in every language.
 */
const ACCENTS: Record<Exclude<Locale, "en">, string> = { es: "#aa151b", fr: "#2f6fc4", de: "#e0a800", pt: "#009b3a" };

/** `english` is the tool's own secondary color, which English keeps. */
export function localeAccent(locale: Locale, english: string): string {
  return locale === "en" ? english : ACCENTS[locale];
}
