import type { Metadata } from "next";
import { CelticKnotBuilderRoute } from "@/components/CelticKnotBuilderRoute";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import celticText from "@/i18n/messages/celticKnot.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";

export function celticKnotMetadata(locale: Locale): Metadata {
  const t = celticText[locale];
  const openGraph = previewOpenGraph("celticKnot", OPENING_OPTION.celticKnot, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/celtic-knots/"), ...(openGraph ? { openGraph } : {}) };
}

export async function CelticKnotView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("celticKnot", locale);
  const t = celticText[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <CelticKnotBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="celticKnot" slug={option ?? OPENING_OPTION.celticKnot} name={labels[option ?? OPENING_OPTION.celticKnot]} locale={locale} />
    </div>
  );
}
