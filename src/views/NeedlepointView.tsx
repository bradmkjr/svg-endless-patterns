import type { Metadata } from "next";
import Link from "next/link";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import { NeedlepointBuilderRoute } from "@/components/NeedlepointBuilderRoute";
import catalog from "@/i18n/messages/needlepoint.json";
import type { Locale } from "@/lib/generator";
import { localePath, pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function needlepointMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  const openGraph = previewOpenGraph("needlepoint", OPENING_OPTION.needlepoint, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/needlepoint/"), ...(openGraph ? { openGraph } : {}) };
}

export async function NeedlepointView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("needlepoint", locale);
  const t = catalog[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede} {t.otherText} <Link href={localePath(locale, "/cross-stitch/")}>{t.otherLink}</Link>
      </p>
      <NeedlepointBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="needlepoint" slug={option ?? OPENING_OPTION.needlepoint} name={labels[option ?? OPENING_OPTION.needlepoint]} locale={locale} />
    </div>
  );
}
