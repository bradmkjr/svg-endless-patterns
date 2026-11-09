import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { FavoritesShelf } from "@/components/FavoritesShelf";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { QuiltBuilderRoute } from "@/components/QuiltBuilderRoute";
import type { Locale } from "@/lib/generator";
import { getBlocks } from "@/lib/patternCatalog";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/quilt.json";

export function quiltMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/quilts/", t.metaTitle, t.metaDesc);
}

export async function QuiltView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("quilt", locale);
  const t = copy[locale];
  const shown = option ?? OPENING_OPTION.quilt;
  const order = new Intl.Collator(locale === "pt" ? "pt-BR" : locale, { sensitivity: "base" });
  const blockNames = Object.fromEntries((await getBlocks(locale)).sort((a, b) => order.compare(a.name, b.name)).map((block) => [block.slug, block.name]));
  return (
    <div className="page">
      <FavoritesShelf locale={locale} kinds={["quilt", "block"]} />
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="quilt" slug={shown} name={labels[shown]}>
        <QuiltBuilderRoute option={option} labels={labels} blockNames={blockNames} locale={locale} />
      </PrimaryImageProvider>
      <section className="prose no-print">
        <h2>{t.aboutTitle}</h2>
        <p>{t.about}</p>
      </section>
      <References ids={["quiltingCottonWeight", "cottonBattingWeight", "polyesterBattingWeight", "threadWeight"]} locale={locale} />
    </div>
  );
}
