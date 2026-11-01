import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { TessellationBuilderRoute } from "@/components/TessellationBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { getTessellationOptions, type Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import text from "@/i18n/messages/tessellation.json";

export function tessellationMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return pageMetadata(locale, "/tessellations/", t.metaTitle, t.metaDesc);
}

export async function TessellationView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("tessellation", locale);
  const t = text[locale];
  const options = await getTessellationOptions(locale);
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="tessellation" slug={option ?? OPENING_OPTION.tessellation} name={labels[option ?? OPENING_OPTION.tessellation]}>
        <TessellationBuilderRoute option={option} labels={labels} options={options} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
