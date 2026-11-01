import type { Metadata } from "next";
import { SashikoBuilderRoute } from "@/components/SashikoBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/sashiko.json";

export function sashikoMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("sashiko", OPENING_OPTION.sashiko, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/sashiko/"), ...(openGraph ? { openGraph } : {}) };
}

export async function SashikoView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("sashiko", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="sashiko" slug={option ?? OPENING_OPTION.sashiko} name={labels[option ?? OPENING_OPTION.sashiko]}>
        <SashikoBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
