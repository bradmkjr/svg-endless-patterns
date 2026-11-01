import type { Metadata } from "next";
import { FractalBuilderRoute } from "@/components/FractalBuilderRoute";
import { StaticPreview } from "@/components/StaticPreview";
import { OPENING_OPTION, previewOpenGraph } from "@/lib/toolOptions";
import { References } from "@/components/References";
import copy from "@/i18n/messages/fractal.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function fractalMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  const openGraph = previewOpenGraph("fractal", OPENING_OPTION.fractal, t.metaTitle, t.metaDesc);
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/fractals/"), ...(openGraph ? { openGraph } : {}) };
}

export async function FractalView({ locale, option }: { locale: Locale; option?: string }) {
  const t = copy[locale];
  const labels = await optionLabels("fractal", locale);
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{option ? `${t.h1}: ${labels[option]}` : t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <FractalBuilderRoute option={option} labels={labels} locale={locale} />
      <StaticPreview group="fractal" slug={option ?? OPENING_OPTION.fractal} name={labels[option ?? OPENING_OPTION.fractal]} locale={locale} />
      <References ids={["mandelbrot", "koch", "sierpinski", "hilbert", "levy"]} locale={locale} />
    </div>
  );
}
