import type { Metadata } from "next";
import { CelticKnotBuilderRoute } from "@/components/CelticKnotBuilderRoute";
import celticText from "@/i18n/messages/celticKnot.json";
import { defaultCelticKnotState } from "@/lib/celticKnotState";
import { generateCelticKnot, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";

export function celticKnotMetadata(locale: Locale): Metadata {
  const t = celticText[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/celtic-knots/") };
}

export async function CelticKnotView({ locale }: { locale: Locale }) {
  const t = celticText[locale];
  const initial = await generateCelticKnot(defaultCelticKnotState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <CelticKnotBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
