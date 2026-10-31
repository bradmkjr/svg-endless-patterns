import type { Metadata } from "next";
import { SashikoBuilderRoute } from "@/components/SashikoBuilderRoute";
import { generateSashiko, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/sashiko.json";
import { defaultSashikoState } from "@/lib/sashikoState";

export function sashikoMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/sashiko/") };
}

export async function SashikoView({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const initial = await generateSashiko(defaultSashikoState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <SashikoBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
