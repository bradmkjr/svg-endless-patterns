import type { Metadata } from "next";
import { CheckerboardBuilderRoute } from "@/components/CheckerboardBuilderRoute";
import copy from "@/i18n/messages/checkerboard.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function checkerboardMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/checkerboards/") };
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
      <CheckerboardBuilderRoute option={option} labels={labels} locale={locale} />
    </div>
  );
}
