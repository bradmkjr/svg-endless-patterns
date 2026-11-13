import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { References } from "@/components/References";
import { OptionNote } from "@/components/OptionNote";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import { OrigamiTessellationBuilderRoute } from "@/components/OrigamiTessellationBuilderRoute";
import type { Locale } from "@/lib/generator";
import { optionLabels } from "@/lib/toolPages";
import copy from "@/i18n/messages/origamiTessellation.json";

export function origamiTessellationMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/origami-tessellations/", t.metaTitle, t.metaDesc);
}

export async function OrigamiTessellationView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("origamiTessellation", locale);
  const t = copy[locale];
  const shown = option ?? OPENING_OPTION.origamiTessellation;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <OptionNote tool="origamiTessellation" option={option} locale={locale} />
      <PrimaryImageProvider group="origamiTessellation" slug={shown} name={labels[shown]}>
        <OrigamiTessellationBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <section className="prose">
        <h2>{t.aboutTitle}</h2>
        <p>{t.about}</p>
      </section>
      <References ids={["miura", "yoshimura", "farnhamWaterbomb", "langTwists", "hullOrigametry"]} locale={locale} />
    </div>
  );
}
