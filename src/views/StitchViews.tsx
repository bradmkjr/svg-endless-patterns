import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StitchBuilderRoute } from "@/components/StitchBuilderRoute";
import { StitchGrid } from "@/components/StitchGrid";
import crochetColorwork from "@/i18n/messages/crochetColorwork.json";
import colorwork from "@/i18n/messages/knitColorwork.json";
import { generateStitchPattern, getStitchPattern, getStitchPatterns, type Craft, type Locale } from "@/lib/generator";
import { fill, localePath, messages } from "@/lib/i18n";
import { CRAFT_PATHS, defaultStitchState } from "@/lib/stitchState";

export function stitchesMetadata(locale: Locale, craft: Craft): Metadata {
  const t = messages(locale).stitches;
  return pageMetadata(locale, `${CRAFT_PATHS[craft]}/`, craft === "knit" ? t.knitMetaTitle : t.crochetMetaTitle, craft === "knit" ? t.knitMetaDesc : t.crochetMetaDesc);
}

export async function StitchesView({ locale, craft }: { locale: Locale; craft: Craft }) {
  const t = messages(locale).stitches;
  const stitches = await getStitchPatterns(craft, locale);
  return (
    <div className="page">
      <h1>{craft === "knit" ? t.knitH1 : t.crochetH1}</h1>
      <p className="lede">{t.lede}</p>
      {craft === "knit" && (
        <p>
          <Link href={localePath(locale, "/knitting/colorwork/")}>{colorwork[locale].indexLink}</Link>
        </p>
      )}
      {craft === "crochet" && (
        <p>
          <Link href={localePath(locale, "/crochet/colorwork/")}>{crochetColorwork[locale].indexLink}</Link>
        </p>
      )}
      <StitchGrid stitches={stitches} locale={locale} />
    </div>
  );
}

export async function stitchSlugs(craft: Craft) {
  return (await getStitchPatterns(craft)).map(({ slug }) => ({ slug }));
}

export async function stitchMetadata(locale: Locale, craft: Craft, slug: string): Promise<Metadata> {
  const stitch = await getStitchPattern(craft, slug, locale);
  if (!stitch) return {};
  const t = messages(locale).stitches;
  return pageMetadata(locale, `${CRAFT_PATHS[craft]}/${stitch.slug}/`, fill(craft === "knit" ? t.knitPageTitle : t.crochetPageTitle, { name: stitch.name }), fill(t.pageDesc, { summary: stitch.summary }));
}

export async function StitchView({ locale, craft, slug }: { locale: Locale; craft: Craft; slug: string }) {
  const stitch = await getStitchPattern(craft, slug, locale);
  if (!stitch) notFound();
  const all = messages(locale);
  const initial = await generateStitchPattern(stitch.slug, defaultStitchState(stitch, locale));
  return (
    <div className="page">
      <p className="no-print" style={{ margin: "0 0 0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        <Link href={localePath(locale, `${CRAFT_PATHS[craft]}/`)}>{craft === "knit" ? all.nav.knitting : all.nav.crochet}</Link> / {stitch.level}
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{stitch.name}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {stitch.summary}
      </p>
      <StitchBuilderRoute stitch={stitch} initial={initial} locale={locale} />
    </div>
  );
}
