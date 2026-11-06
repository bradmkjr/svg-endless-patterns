import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { ReactionDiffusionBuilderRoute } from "@/components/ReactionDiffusionBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/reactionDiffusion.json";

export function reactionDiffusionMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/turing-patterns/", t.metaTitle, t.metaDesc);
}

export async function ReactionDiffusionView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("reactionDiffusion", locale);
  const t = copy[locale];
  const slug = option ?? OPENING_OPTION.reactionDiffusion;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="reactionDiffusion" slug={slug} name={labels[slug]}>
        <ReactionDiffusionBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <h2>{t.howH}</h2>
      <p>{t.how}</p>
      <References ids={["pearsonGrayScott", "simsReactionDiffusion"]} locale={locale} />
    </div>
  );
}
