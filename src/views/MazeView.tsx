import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { MazeBuilderRoute } from "@/components/MazeBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { OPENING_OPTION } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import copy from "@/i18n/messages/maze.json";
import { optionLabels } from "@/lib/toolPages";
import { References } from "@/components/References";

export function mazeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/mazes/", t.metaTitle, t.metaDesc);
}

export async function MazeView({ locale, option }: { locale: Locale; option?: string }) {
  const labels = await optionLabels("maze", locale);
  const t = copy[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="maze" slug={option ?? OPENING_OPTION.maze} name={labels[option ?? OPENING_OPTION.maze]}>
        <MazeBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
      <References ids={["prim", "kruskal", "wilson"]} locale={locale} />
    </div>
  );
}
