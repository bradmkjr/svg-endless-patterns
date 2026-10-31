import type { Metadata } from "next";
import { TartanBuilderRoute } from "@/components/TartanBuilderRoute";
import type { Locale } from "@/lib/generator";
import { messages, pageAlternates } from "@/lib/i18n";

export function tartanMetadata(locale: Locale): Metadata {
  const t = messages(locale).tartan;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/tartans/") };
}

export async function TartanView({ locale }: { locale: Locale }) {
  const t = messages(locale).tartan;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <TartanBuilderRoute locale={locale} />
    </div>
  );
}
