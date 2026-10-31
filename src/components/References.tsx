import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { referencesFor, referenceText, type ReferenceId } from "@/lib/references";

export function ReferenceItem({ id, locale }: { id: ReferenceId; locale: Locale }) {
  const [reference] = referencesFor([id]);
  return (
    <li>
      {reference.author}, {reference.url ? <a href={reference.url} rel="noopener">{reference.title}</a> : <cite>{reference.title}</cite>}
      {reference.detail && `, ${reference.detail}`}. {referenceText(locale).usedFor[id]}
    </li>
  );
}

/** A tool's sources, under its builder. */
export function References({ ids, locale }: { ids: ReferenceId[]; locale: Locale }) {
  const t = referenceText(locale);
  return (
    <section className="no-print" style={{ marginTop: "2rem", fontSize: "0.9rem", color: "var(--muted)" }}>
      <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.4rem" }}>{t.sourcesH}</h2>
      <ul style={{ margin: "0 0 0.4rem", paddingLeft: "1.2rem" }}>
        {ids.map((id) => (
          <ReferenceItem key={id} id={id} locale={locale} />
        ))}
      </ul>
      <Link href={localePath(locale, "/acknowledgements/")}>{t.h1}</Link>
    </section>
  );
}
