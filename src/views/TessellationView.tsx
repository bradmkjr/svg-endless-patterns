import type { Metadata } from "next";
import { TessellationBuilderRoute } from "@/components/TessellationBuilderRoute";
import { getTessellationOptions, type Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { pageAlternates } from "@/lib/i18n";
import text from "@/i18n/messages/tessellation.json";

export function tessellationMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/tessellations/") };
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
      <TessellationBuilderRoute option={option} labels={labels} options={options} locale={locale} />
    </div>
  );
}
