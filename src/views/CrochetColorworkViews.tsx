import type { Metadata } from "next";
import { CrochetColorworkBuilderRoute } from "@/components/CrochetColorworkBuilderRoute";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import copy from "@/i18n/messages/crochetColorwork.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function crochetColorworkMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("crochetColorwork", OPENING_OPTION.crochetColorwork, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/crochet/colorwork/"), ...(openGraph ? { openGraph } : {}) };
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
      <CrochetColorworkBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="crochetColorwork" slug={option ?? OPENING_OPTION.crochetColorwork} name={labels[option ?? OPENING_OPTION.crochetColorwork]} locale={locale} />
    </div>
  );
}
