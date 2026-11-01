import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { MandalaBuilderRoute } from "@/components/MandalaBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import mandalaText from "@/i18n/messages/mandala.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";

export function mandalaMetadata(locale: Locale): Metadata {
  const t = mandalaText[locale];
  return pageMetadata(locale, "/mandalas/", t.metaTitle, t.metaDesc);
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
