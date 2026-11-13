import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { OptionNote } from "@/components/OptionNote";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { KaleidoscopeBuilderRoute } from "@/components/KaleidoscopeBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/kaleidoscope.json";

export function kaleidoscopeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/kaleidoscopes/", t.metaTitle, t.metaDesc);
}

export async function KaleidoscopeView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("kaleidoscope", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="kaleidoscope" option={option} locale={locale} />
      <PrimaryImageProvider group="kaleidoscope" slug={option ?? OPENING_OPTION.kaleidoscope} name={labels[option ?? OPENING_OPTION.kaleidoscope]}>
        <KaleidoscopeBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["brewster", "coxeter"]} locale={locale} />
    </div>
  );
}
