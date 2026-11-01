import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { PaletteBook } from "@/components/PaletteBook";
import type { Locale } from "@/lib/generator";
import text from "@/i18n/messages/palettes.json";

export function paletteMetadata(locale: Locale): Metadata {
  const t = text[locale];
  return pageMetadata(locale, "/palettes/", t.metaTitle, t.metaDesc);
}

export function PaletteView({ locale }: { locale: Locale }) {
  const t = text[locale];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PaletteBook locale={locale} />
    </div>
  );
}
