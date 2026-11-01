import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { StainedGlassBuilderRoute } from "@/components/StainedGlassBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import text from "@/i18n/messages/stainedGlass.json";

export function stainedGlassMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return pageMetadata(locale, "/stained-glass/", t.metaTitle, t.metaDesc);
}

export async function StainedGlassView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("stainedGlass", locale);
  const t = text[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="stainedGlass" slug={option ?? OPENING_OPTION.stainedGlass} name={labels[option ?? OPENING_OPTION.stainedGlass]}>
        <StainedGlassBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
