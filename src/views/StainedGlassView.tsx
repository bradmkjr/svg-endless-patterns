import type { Metadata } from "next";
import { StainedGlassBuilderRoute } from "@/components/StainedGlassBuilderRoute";
import { generateStainedGlass, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { defaultStainedGlassState } from "@/lib/stainedGlassState";
import text from "@/i18n/messages/stainedGlass.json";

export function stainedGlassMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/stained-glass/") };
}

export async function StainedGlassView({ locale }: { locale: Locale }) {
  const t = text[locale];
  const initial = await generateStainedGlass(defaultStainedGlassState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <StainedGlassBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
