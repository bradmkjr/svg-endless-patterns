import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { TruchetBuilderRoute } from "@/components/TruchetBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/truchet.json";

export function truchetMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/truchet/", t.metaTitle, t.metaDesc);
}

export async function TruchetView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("truchet", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="truchet" slug={option ?? OPENING_OPTION.truchet} name={labels[option ?? OPENING_OPTION.truchet]}>
        <TruchetBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["truchet"]} locale={locale} />
    </div>
  );
}
