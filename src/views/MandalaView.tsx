import type { Metadata } from "next";
import { MandalaBuilderRoute } from "@/components/MandalaBuilderRoute";
import mandalaText from "@/i18n/messages/mandala.json";
import { generateMandala, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { defaultMandalaState } from "@/lib/mandalaState";

export function mandalaMetadata(locale: Locale): Metadata {
  const t = mandalaText[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/mandalas/") };
}

export async function MandalaView({ locale }: { locale: Locale }) {
  const t = mandalaText[locale];
  const initial = await generateMandala(defaultMandalaState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <MandalaBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
