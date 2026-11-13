import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { OptionNote } from "@/components/OptionNote";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { WeavingBuilderRoute } from "@/components/WeavingBuilderRoute";
import { WeavingDrafts } from "@/components/WeavingDrafts";
import { OPENING_OPTION } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import { weavingDraftLinks } from "@/lib/weavingDrafts";
import copy from "@/i18n/messages/weaving.json";

export function weavingMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/weaving/", t.metaTitle, t.metaDesc);
}

export async function WeavingView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("weaving", locale);
  const t = copy[locale];
  const drafts = weavingDraftLinks(locale);
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="weaving" option={option} locale={locale} />
      <PrimaryImageProvider group="weaving" slug={option ?? OPENING_OPTION.weaving} name={labels[option ?? OPENING_OPTION.weaving]}>
        <WeavingBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <section style={{ marginTop: "2.5rem" }}>
        <h2 id="drafts">{t.draftsH}</h2>
        <p className="lede">{t.draftsLede}</p>
        <WeavingDrafts drafts={drafts} />
      </section>
      <References ids={["oelsnerWeaves", "watsonColour", "bronsonLace"]} locale={locale} />
    </div>
  );
}
