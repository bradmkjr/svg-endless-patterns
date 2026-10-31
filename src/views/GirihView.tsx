import type { Metadata } from "next";
import { References } from "@/components/References";
import { GirihBuilderRoute } from "@/components/GirihBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";
import text from "@/i18n/messages/girih.json";

export function girihMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/girih/") };
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
      <GirihBuilderRoute option={option} labels={labels} locale={locale} />
      <References ids={["girih"]} locale={locale} />
    </div>
  );
}
