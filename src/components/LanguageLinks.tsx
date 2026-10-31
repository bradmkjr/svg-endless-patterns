"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { localePath, messages, SITE_LOCALES, stripLocale } from "@/lib/i18n";
import { publicPath } from "@/lib/site";
import styles from "./SiteNav.module.css";

function Links({ locale, query }: { locale: Locale; query: string }) {
  const page = stripLocale(usePathname());
  return (
    <nav className={styles.languages} aria-label={messages(locale).nav.language}>
      {SITE_LOCALES.map(({ code, label, htmlLang }) => (
        // A plain link: each language has its own root layout, so this is a full page load anyway.
        <a key={code} href={publicPath(`${localePath(code, page)}${query}`)} lang={htmlLang} hrefLang={htmlLang} aria-current={code === locale ? "true" : undefined} className={code === locale ? styles.languageOn : undefined}>
          {label}
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
