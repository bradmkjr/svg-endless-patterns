import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/pageMetadata";
import { BraidBuilderRoute } from "@/components/BraidBuilderRoute";
import { OptionNote } from "@/components/OptionNote";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import copy from "@/i18n/messages/braid.json";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { BRAID_REFERENCES } from "@/lib/references";
import { optionLabels } from "@/lib/toolPages";

export function braidMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/braids/", t.metaTitle, t.metaDesc);
}

export async function BraidView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("braid", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="braid" option={option} locale={locale} />
      <PrimaryImageProvider group="braid" slug={option ?? OPENING_OPTION.braid} name={labels[option ?? OPENING_OPTION.braid]}>
        <BraidBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <p className="no-print" style={{ marginTop: "2rem" }}>
        <Link href={localePath(locale, "/weaving/")}>{t.weavingLink}</Link> · <Link href={localePath(locale, "/celtic-knots/")}>{t.celticLink}</Link>
      </p>
      <References ids={BRAID_REFERENCES} locale={locale} />
    </div>
  );
}
