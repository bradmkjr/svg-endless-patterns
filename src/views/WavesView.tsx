import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { WavesBuilderRoute } from "@/components/WavesBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/waves.json";

export function wavesMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/waves/", t.metaTitle, t.metaDesc);
}

export async function WavesView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("waves", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="waves" slug={option ?? OPENING_OPTION.waves} name={labels[option ?? OPENING_OPTION.waves]}>
        <WavesBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["lissajous"]} locale={locale} />
    </div>
  );
}
