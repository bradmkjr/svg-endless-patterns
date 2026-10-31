import type { Metadata } from "next";
import Link from "next/link";
import { CrossStitchBuilderRoute } from "@/components/CrossStitchBuilderRoute";
import catalog from "@/i18n/messages/crossStitch.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { localePath, pageAlternates } from "@/lib/i18n";

export function crossStitchMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/cross-stitch/") };
}

export async function CrossStitchView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("crossStitch", locale);
  const t = catalog[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede} {t.otherText} <Link href={localePath(locale, "/needlepoint/")}>{t.otherLink}</Link>
      </p>
      <CrossStitchBuilderRoute option={option} labels={labels} locale={locale} />
    </div>
  );
}
