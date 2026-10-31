import type { Metadata } from "next";
import { ReferenceItem } from "@/components/References";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { REFERENCES, referenceText } from "@/lib/references";

export function acknowledgementsMetadata(locale: Locale): Metadata {
  const t = referenceText(locale);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/acknowledgements/") };
}

export function AcknowledgementsView({ locale }: { locale: Locale }) {
  const t = referenceText(locale);
  return (
    <div className="page prose">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      <h2>{t.sourcesH}</h2>
      <ul>
        {REFERENCES.map((reference) => (
          <ReferenceItem key={reference.id} id={reference.id} locale={locale} />
        ))}
      </ul>
      <h2>{t.traditionsH}</h2>
      <p>{t.traditions}</p>
    </div>
  );
}
