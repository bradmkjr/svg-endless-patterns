import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { KnitColorworkBuilderRoute } from "@/components/KnitColorworkBuilderRoute";
import { References } from "@/components/References";
import copy from "@/i18n/messages/knitColorwork.json";
import type { Locale } from "@/lib/generator";
import { localePath, messages } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function knitColorworkMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/knitting/colorwork/", t.metaTitle, t.metaDesc);
}

export async function KnitColorworkView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("knitColorwork", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <p className="no-print" style={{ margin: "0 0 0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        <Link href={localePath(locale, "/knitting/")}>{messages(locale).nav.knitting}</Link>
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="knitColorwork" slug={option ?? OPENING_OPTION.knitColorwork} name={labels[option ?? OPENING_OPTION.knitColorwork]}>
        <KnitColorworkBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["walkerMosaic"]} locale={locale} />
    </div>
  );
}
