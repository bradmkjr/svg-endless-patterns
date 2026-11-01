import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { SashikoBuilderRoute } from "@/components/SashikoBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/sashiko.json";

export function sashikoMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/sashiko/", t.metaTitle, t.metaDesc);
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
