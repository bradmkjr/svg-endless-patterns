import type { Metadata } from "next";
import Link from "next/link";
import { NeedlepointBuilderRoute } from "@/components/NeedlepointBuilderRoute";
import catalog from "@/i18n/messages/needlepoint.json";
import { generateNeedlepoint, type Locale } from "@/lib/generator";
import { localePath, pageAlternates } from "@/lib/i18n";
import { defaultNeedlepointState } from "@/lib/needlepointState";

export function needlepointMetadata(locale: Locale): Metadata {
  const t = catalog[locale];
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates(locale, "/needlepoint/") };
}

export async function NeedlepointView({ locale }: { locale: Locale }) {
  const t = catalog[locale];
  const initial = await generateNeedlepoint(defaultNeedlepointState(locale));
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede} {t.otherText} <Link href={localePath(locale, "/cross-stitch/")}>{t.otherLink}</Link>
      </p>
      <NeedlepointBuilderRoute initial={initial} locale={locale} />
    </div>
  );
}
