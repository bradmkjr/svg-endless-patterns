import type { Metadata } from "next";
import { TartanBuilderRoute } from "@/components/TartanBuilderRoute";
import { generateTartan, type Locale } from "@/lib/generator";
import { messages, pageAlternates } from "@/lib/i18n";
import { defaultTartanState } from "@/lib/tartanState";

export function tartanMetadata(locale: Locale): Metadata {
  const t = messages(locale).tartan;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/tartans/") };
}

export async function TartanView({ locale }: { locale: Locale }) {
  const t = messages(locale).tartan;
  const initial = await generateTartan(defaultTartanState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <TartanBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
