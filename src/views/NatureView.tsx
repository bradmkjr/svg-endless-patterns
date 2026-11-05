import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { NatureBuilderRoute } from "@/components/NatureBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/nature.json";

export function natureMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/nature-patterns/", t.metaTitle, t.metaDesc);
}

export async function NatureView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("nature", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="nature" slug={option ?? OPENING_OPTION.nature} name={labels[option ?? OPENING_OPTION.nature]}>
        <NatureBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["cookStochastic"]} locale={locale} />
    </div>
  );
}
