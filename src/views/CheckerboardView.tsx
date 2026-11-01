import type { Metadata } from "next";
import { CheckerboardBuilderRoute } from "@/components/CheckerboardBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import copy from "@/i18n/messages/checkerboard.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function checkerboardMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("checkerboard", OPENING_OPTION.checkerboard, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/checkerboards/"), ...(openGraph ? { openGraph } : {}) };
}

export async function CheckerboardView({ locale, option }: { locale: Locale; option?: string }) {
  const t = copy[locale];
  const labels = await optionLabels("checkerboard", locale);
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="checkerboard" slug={option ?? OPENING_OPTION.checkerboard} name={labels[option ?? OPENING_OPTION.checkerboard]}>
        <CheckerboardBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
