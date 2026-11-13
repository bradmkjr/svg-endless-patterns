import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { OptionNote } from "@/components/OptionNote";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { KolamBuilderRoute } from "@/components/KolamBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/kolam.json";

export function kolamMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/kolam/", t.metaTitle, t.metaDesc);
}

export async function KolamView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("kolam", locale);
  const t = copy[locale];
  const shown = option ?? OPENING_OPTION.kolam;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="kolam" option={option} locale={locale} />
      <PrimaryImageProvider group="kolam" slug={shown} name={labels[shown]}>
        <KolamBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <section className="prose">
        <h2>{t.aboutTitle}</h2>
        <p>{t.about}</p>
      </section>
      <References ids={["raghavacharyKolam", "gopalanSikku"]} locale={locale} />
    </div>
  );
}
