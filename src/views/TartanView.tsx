import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { TartanBuilderRoute } from "@/components/TartanBuilderRoute";
import type { Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";

export function tartanMetadata(locale: Locale): Metadata {
  const t = messages(locale).tartan;
  return pageMetadata(locale, "/tartans/", t.metaTitle, t.metaDesc);
}

export async function TartanView({ locale }: { locale: Locale }) {
  const t = messages(locale).tartan;
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <PrimaryImageProvider group="tartan" slug="forest" name={t.presets.forest}>
        <TartanBuilderRoute locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
