import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { OptionNote } from "@/components/OptionNote";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { ChineseLatticeBuilderRoute } from "@/components/ChineseLatticeBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import text from "@/i18n/messages/chineseLattice.json";

export function chineseLatticeMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return pageMetadata(locale, "/chinese-lattice/", t.metaTitle, t.metaDesc);
}

export async function ChineseLatticeView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("chineseLattice", locale);
  const t = text[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="chineseLattice" option={option} locale={locale} />
      <PrimaryImageProvider group="chineseLattice" slug={option ?? OPENING_OPTION.chineseLattice} name={labels[option ?? OPENING_OPTION.chineseLattice]}>
        <ChineseLatticeBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["dyeLattice"]} locale={locale} />
    </div>
  );
}
