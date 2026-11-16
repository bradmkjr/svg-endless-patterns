import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/pageMetadata";
import { LetteringBuilderRoute } from "@/components/LetteringBuilderRoute";
import { OptionNote } from "@/components/OptionNote";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import copy from "@/i18n/messages/lettering.json";
import crochetColorwork from "@/i18n/messages/crochetColorwork.json";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { LETTERING_REFERENCES } from "@/lib/references";
import { optionLabels } from "@/lib/toolPages";

export function letteringMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/lettering/", t.metaTitle, t.metaDesc);
}

export async function LetteringView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("lettering", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="lettering" option={option} locale={locale} />
      <PrimaryImageProvider group="lettering" slug={option ?? OPENING_OPTION.lettering} name={labels[option ?? OPENING_OPTION.lettering]}>
        <LetteringBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <p className="no-print" style={{ marginTop: "2rem" }}>
        <Link href={localePath(locale, "/crochet/colorwork/")}>{crochetColorwork[locale].indexLink}</Link>
      </p>
      <References ids={LETTERING_REFERENCES} locale={locale} />
    </div>
  );
}
