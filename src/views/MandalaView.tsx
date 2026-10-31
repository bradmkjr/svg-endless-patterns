import type { Metadata } from "next";
import { MandalaBuilderRoute } from "@/components/MandalaBuilderRoute";
import mandalaText from "@/i18n/messages/mandala.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";

export function mandalaMetadata(locale: Locale): Metadata {
  const t = mandalaText[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/mandalas/") };
}

export async function MandalaView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("mandala", locale);
  const t = mandalaText[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <MandalaBuilderRoute option={option} labels={labels} locale={locale} />
    </div>
  );
}
