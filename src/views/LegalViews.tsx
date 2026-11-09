import type { Metadata } from "next";
import { RichText } from "@/components/RichText";
import text from "@/i18n/messages/legal.json";
import { formatDate } from "@/lib/content";
import type { Locale } from "@/lib/generator";
import { fill } from "@/lib/i18n";
import { pageMetadata } from "@/lib/pageMetadata";

/** Change this whenever the wording of either page changes. */
const UPDATED = "2026-11-08";

type Page = { metaTitle: string; metaDesc: string; h1: string; sections: { h: string; body: string[]; items?: string[] }[] };

function LegalView({ locale, page }: { locale: Locale; page: Page }) {
  return (
    <div className="page prose">
      <h1>{page.h1}</h1>
      <p className="lede">{fill(text[locale].updated, { date: formatDate(UPDATED, locale) })}</p>
      {page.sections.map((section) => (
        <section key={section.h}>
          <h2>{section.h}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} locale={locale} />
            </p>
          ))}
          {section.items && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function privacyMetadata(locale: Locale): Metadata {
  const t = text[locale].privacy;
  return pageMetadata(locale, "/privacy/", t.metaTitle, t.metaDesc);
}

export function PrivacyView({ locale }: { locale: Locale }) {
  return <LegalView locale={locale} page={text[locale].privacy} />;
}

export function termsMetadata(locale: Locale): Metadata {
  const t = text[locale].terms;
  return pageMetadata(locale, "/terms/", t.metaTitle, t.metaDesc);
}

export function TermsView({ locale }: { locale: Locale }) {
  return <LegalView locale={locale} page={text[locale].terms} />;
}
