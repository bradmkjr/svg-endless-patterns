import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { MandalaBuilderRoute } from "@/components/MandalaBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import mandalaText from "@/i18n/messages/mandala.json";
import type { Locale } from "@/lib/generator";
import { foldFromSlug, foldPageSlugs } from "@/lib/mandalaState";
import { toolSlugs } from "@/lib/toolOptions";
import { optionLabels, optionMetadata } from "@/lib/toolPages";

export function mandalaMetadata(locale: Locale): Metadata {
  const t = mandalaText[locale];
  return pageMetadata(locale, "/mandalas/", t.metaTitle, t.metaDesc);
}

/** Every style's page, plus the old fold pages, so links to those keep working. */
export const mandalaStaticParams = () => [...toolSlugs("mandala"), ...foldPageSlugs().map((option) => ({ option }))];

/** An old fold page points search engines at the main page, and only styles are listed in the sitemap. */
export async function mandalaOptionMetadata(locale: Locale, option: string): Promise<Metadata> {
  return foldFromSlug(option) ? mandalaMetadata(locale) : optionMetadata("mandala", locale, option, mandalaMetadata(locale));
}

export async function MandalaView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("mandala", locale);
  const t = mandalaText[locale];
  const fold = foldFromSlug(option);
  const style = fold ? undefined : option;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{style ? `${t.h1}: ${labels[style]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="mandala" slug={style ?? OPENING_OPTION.mandala} name={labels[style ?? OPENING_OPTION.mandala]}>
        <MandalaBuilderRoute option={style} fold={fold} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
