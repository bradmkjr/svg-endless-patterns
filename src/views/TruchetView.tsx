import type { Metadata } from "next";
import { References } from "@/components/References";
import { TruchetBuilderRoute } from "@/components/TruchetBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/truchet.json";

export function truchetMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/truchet/") };
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
      <TruchetBuilderRoute option={option} labels={labels} locale={locale} />
      <References ids={["truchet"]} locale={locale} />
    </div>
  );
}
