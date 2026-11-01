import type { Metadata } from "next";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import { LifeBuilderRoute } from "@/components/LifeBuilderRoute";
import { References } from "@/components/References";
import copy from "@/i18n/messages/life.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function lifeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("life", OPENING_OPTION.life, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/life-patterns/"), ...(openGraph ? { openGraph } : {}) };
}

export async function LifeView({ locale, option }: { locale: Locale; option?: string }) {
  const t = copy[locale];
  const labels = await optionLabels("life", locale);
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <LifeBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="life" slug={option ?? OPENING_OPTION.life} name={labels[option ?? OPENING_OPTION.life]} locale={locale} />
      <References ids={["gardnerLife"]} locale={locale} />
    </div>
  );
}
