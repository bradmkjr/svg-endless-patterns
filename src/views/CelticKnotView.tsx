import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { CelticKnotBuilderRoute } from "@/components/CelticKnotBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import celticText from "@/i18n/messages/celticKnot.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";

export function celticKnotMetadata(locale: Locale): Metadata {
  const t = celticText[locale];
  return pageMetadata(locale, "/celtic-knots/", t.metaTitle, t.metaDesc);
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
      <PrimaryImageProvider group="celticKnot" slug={option ?? OPENING_OPTION.celticKnot} name={labels[option ?? OPENING_OPTION.celticKnot]}>
        <CelticKnotBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
