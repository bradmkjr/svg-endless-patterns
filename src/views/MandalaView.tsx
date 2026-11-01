import type { Metadata } from "next";
import { MandalaBuilderRoute } from "@/components/MandalaBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import mandalaText from "@/i18n/messages/mandala.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";

export function mandalaMetadata(locale: Locale): Metadata {
  const t = mandalaText[locale];
  const openGraph = previewOpenGraph("mandala", OPENING_OPTION.mandala, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/mandalas/"), ...(openGraph ? { openGraph } : {}) };
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
      <PrimaryImageProvider group="mandala" slug={option ?? OPENING_OPTION.mandala} name={labels[option ?? OPENING_OPTION.mandala]}>
        <MandalaBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
