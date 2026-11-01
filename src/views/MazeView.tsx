import type { Metadata } from "next";
import { MazeBuilderRoute } from "@/components/MazeBuilderRoute";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import copy from "@/i18n/messages/maze.json";
import { optionLabels } from "@/lib/toolPages";
import { References } from "@/components/References";

export function mazeMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("maze", OPENING_OPTION.maze, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/mazes/"), ...(openGraph ? { openGraph } : {}) };
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
      <MazeBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="maze" slug={option ?? OPENING_OPTION.maze} name={labels[option ?? OPENING_OPTION.maze]} locale={locale} />
      <References ids={["prim", "kruskal", "wilson"]} locale={locale} />
    </div>
  );
}
