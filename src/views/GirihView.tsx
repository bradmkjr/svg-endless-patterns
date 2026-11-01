import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { GirihBuilderRoute } from "@/components/GirihBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import text from "@/i18n/messages/girih.json";

export function girihMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return pageMetadata(locale, "/girih/", t.metaTitle, t.metaDesc);
}

export async function GirihView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("girih", locale);
  const t = text[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="girih" slug={option ?? OPENING_OPTION.girih} name={labels[option ?? OPENING_OPTION.girih]}>
        <GirihBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["girih"]} locale={locale} />
    </div>
  );
}
