"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { localePath, messages, SITE_LOCALES, stripLocale } from "@/lib/i18n";
import { publicPath } from "@/lib/site";
import { LanguageFlag } from "./LanguageFlag";
import styles from "./SiteNav.module.css";

function Links({ locale, query }: { locale: Locale; query: string }) {
  const page = stripLocale(usePathname());
  const label = messages(locale).nav.language;
  return (
    <nav className={styles.languages} aria-label={label}>
      <span className={styles.languageLabel}>
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden focusable="false">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <ellipse cx="8" cy="8" rx="2.8" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.5 8h13M2.6 4.6h10.8M2.6 11.4h10.8" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        {label}
      </span>
      {SITE_LOCALES.map(({ code, label, htmlLang }) => (
        // A plain link: each language has its own root layout, so this is a full page load anyway.
        <a key={code} href={publicPath(`${localePath(code, page)}${query}`)} lang={htmlLang} hrefLang={htmlLang} title={label} aria-current={code === locale ? "true" : undefined} className={code === locale ? styles.languageOn : undefined}>
          <LanguageFlag locale={code} className={styles.flag} />
          <span className={styles.languageName}>{label}</span>
          <span className={styles.languageCode} aria-hidden>
            {code.toUpperCase()}
          </span>
        </a>
      ))}
    </nav>
  );
}

function WithQuery({ locale }: { locale: Locale }) {
  const query = useSearchParams().toString();
  return <Links locale={locale} query={query ? `?${query}` : ""} />;
}

/** The same page in each language, keeping any share-link settings. */
export function LanguageLinks({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<Links locale={locale} query="" />}>
      <WithQuery locale={locale} />
    </Suspense>
  );
}
