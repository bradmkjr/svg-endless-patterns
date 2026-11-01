import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { NeedlepointBuilderRoute } from "@/components/NeedlepointBuilderRoute";
import catalog from "@/i18n/messages/needlepoint.json";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function needlepointMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  return pageMetadata(locale, "/needlepoint/", t.metaTitle, t.metaDesc);
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
      <PrimaryImageProvider group="needlepoint" slug={option ?? OPENING_OPTION.needlepoint} name={labels[option ?? OPENING_OPTION.needlepoint]}>
        <NeedlepointBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
