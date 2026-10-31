import type { Metadata } from "next";
import { GirihBuilderRoute } from "@/components/GirihBuilderRoute";
import { generateGirih, type Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { defaultGirihState } from "@/lib/girihState";
import text from "@/i18n/messages/girih.json";

export function girihMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/girih/") };
}

export async function GirihView({ locale }: { locale: Locale }) {
  const t = text[locale];
  const initial = await generateGirih(defaultGirihState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <GirihBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
