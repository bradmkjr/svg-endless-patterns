import type { Metadata } from "next";
import { TruchetBuilderRoute } from "@/components/TruchetBuilderRoute";
import { generateTruchet, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/truchet.json";
import { defaultTruchetState } from "@/lib/truchetState";

export function truchetMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/truchet/") };
}

export async function TruchetView({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const initial = await generateTruchet(defaultTruchetState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <TruchetBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
