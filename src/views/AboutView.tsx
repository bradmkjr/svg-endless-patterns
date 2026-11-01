import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import type { Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";

export function aboutMetadata(locale: Locale): Metadata {
  const t = messages(locale).about;
  return pageMetadata(locale, "/about/", t.metaTitle, t.metaDesc);
}

export function AboutView({ locale }: { locale: Locale }) {
  const t = messages(locale).about;
  return (
    <div className="page prose">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>

      <h2>{t.cutH}</h2>
      <ul>
        <li>{t.cutRect}</li>
        <li>{t.cutHalf}</li>
        <li>{t.cutQuarter}</li>
        <li>{t.cutTemplate}</li>
        <li>{t.cutSeams}</li>
      </ul>

      <h2>{t.rulerH}</h2>
      <p>{t.ruler}</p>

      <h2>{t.yardageH}</h2>
      <p>{t.yardage}</p>

      <h2>{t.stitchH}</h2>
      <p>{t.stitch1}</p>
      <p>{t.stitch2}</p>

      <h2>{t.dataH}</h2>
      <p>{t.data}</p>

      <h2>{t.designsH}</h2>
      <p>{t.designs}</p>

      {t.languageH && (
        <>
          <h2>{t.languageH}</h2>
          <p>{t.language}</p>
        </>
      )}
    </div>
  );
}
