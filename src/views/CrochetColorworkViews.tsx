import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { CrochetColorworkBuilderRoute } from "@/components/CrochetColorworkBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import copy from "@/i18n/messages/crochetColorwork.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";

export function crochetColorworkMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/crochet/colorwork/", t.metaTitle, t.metaDesc);
}

export async function CrochetColorworkView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("crochetColorwork", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="crochetColorwork" slug={option ?? OPENING_OPTION.crochetColorwork} name={labels[option ?? OPENING_OPTION.crochetColorwork]}>
        <CrochetColorworkBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
