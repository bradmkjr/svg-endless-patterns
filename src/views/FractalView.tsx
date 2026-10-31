import type { Metadata } from "next";
import { FractalBuilderRoute } from "@/components/FractalBuilderRoute";
import { References } from "@/components/References";
import copy from "@/i18n/messages/fractal.json";
import type { Locale } from "@/lib/generator";
import { pageAlternates } from "@/lib/i18n";
import { optionLabels } from "@/lib/toolPages";

export function fractalMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/fractals/") };
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
      <References ids={["mandelbrot", "koch", "sierpinski", "hilbert", "levy"]} locale={locale} />
    </div>
  );
}
