import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { CrossStitchBuilderRoute } from "@/components/CrossStitchBuilderRoute";
import catalog from "@/i18n/messages/crossStitch.json";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { localePath } from "@/lib/i18n";

export function crossStitchMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  return pageMetadata(locale, "/cross-stitch/", t.metaTitle, t.metaDesc);
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
      <PrimaryImageProvider group="crossStitch" slug={option ?? OPENING_OPTION.crossStitch} name={labels[option ?? OPENING_OPTION.crossStitch]}>
        <CrossStitchBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
