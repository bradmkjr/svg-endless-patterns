import type { Metadata } from "next";
import { CrochetColorworkBuilderRoute } from "@/components/CrochetColorworkBuilderRoute";
import copy from "@/i18n/messages/crochetColorwork.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function crochetColorworkMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/crochet/colorwork/") };
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
    </div>
  );
}
