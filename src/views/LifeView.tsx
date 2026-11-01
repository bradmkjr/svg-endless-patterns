import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { LifeBuilderRoute } from "@/components/LifeBuilderRoute";
import { References } from "@/components/References";
import copy from "@/i18n/messages/life.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";

export function lifeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/life-patterns/", t.metaTitle, t.metaDesc);
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
      <PrimaryImageProvider group="life" slug={option ?? OPENING_OPTION.life} name={labels[option ?? OPENING_OPTION.life]}>
        <LifeBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["gardnerLife"]} locale={locale} />
    </div>
  );
}
