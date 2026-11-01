import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { TieDyeBuilderRoute } from "@/components/TieDyeBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/tieDye.json";

export function tieDyeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/tie-dye/", t.metaTitle, t.metaDesc);
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
      <PrimaryImageProvider group="tieDye" slug={option ?? OPENING_OPTION.tieDye} name={labels[option ?? OPENING_OPTION.tieDye]}>
        <TieDyeBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["dharmaTieDye"]} locale={locale} />
    </div>
  );
}
