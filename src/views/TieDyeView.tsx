import type { Metadata } from "next";
import { References } from "@/components/References";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import { TieDyeBuilderRoute } from "@/components/TieDyeBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/tieDye.json";

export function tieDyeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("tieDye", OPENING_OPTION.tieDye, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/tie-dye/"), ...(openGraph ? { openGraph } : {}) };
}

export async function TieDyeView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("tieDye", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <TieDyeBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="tieDye" slug={option ?? OPENING_OPTION.tieDye} name={labels[option ?? OPENING_OPTION.tieDye]} locale={locale} />
      <References ids={["dharmaTieDye"]} locale={locale} />
    </div>
  );
}
