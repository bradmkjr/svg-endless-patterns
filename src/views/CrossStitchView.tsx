import type { Metadata } from "next";
import { CrossStitchBuilderRoute } from "@/components/CrossStitchBuilderRoute";
import catalog from "@/i18n/messages/crossStitch.json";
import { defaultCrossStitchState } from "@/lib/crossStitchState";
import { generateCrossStitch, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";

export function crossStitchMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/cross-stitch/") };
}

export async function CrossStitchView({ locale }: { locale: Locale }) {
  const t = catalog[locale];
  const initial = await generateCrossStitch(defaultCrossStitchState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <CrossStitchBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
