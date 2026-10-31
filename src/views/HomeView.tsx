import type { Metadata } from "next";
import Link from "next/link";
import { BlockGrid } from "@/components/BlockGrid";
import { StitchGrid } from "@/components/StitchGrid";
import { generatePattern, getBlock, getBlocks, getStitchPatterns, type Locale } from "@/lib/generator";
import { localePath, messages, pageAlternates } from "@/lib/i18n";
import { defaultState } from "@/lib/state";
import styles from "./HomeView.module.css";

export function homeMetadata(locale: Locale): Metadata {
  return { alternates: pageAlternates(locale, "/") };
}

export async function HomeView({ locale }: { locale: Locale }) {
  const t = messages(locale).home;
  const blocks = await getBlocks(locale);
  const knitting = await getStitchPatterns("knit", locale);
  const crochet = await getStitchPatterns("crochet", locale);
  const logCabin = (await getBlock("log-cabin", locale))!;
  const hero = await generatePattern(logCabin.slug, {
    ...defaultState(logCabin, locale),
    size: 10.5,
    cols: 4,
    rows: 4,
    border: 0,
    setting: "quadrants",
    seams: true,
  });

  return (
    <>
      <section className={styles.hero}>
        <div>
          <h1>{t.h1}</h1>
          <p className="lede">{t.lede}</p>
          <Link href={localePath(locale, "/blocks/")} className={styles.cta}>
            {t.cta}
          </Link>
        </div>
        <div className={`art ${styles.quilt}`} dangerouslySetInnerHTML={{ __html: hero.svg.quilt }} />
      </section>

      <section className={styles.band}>
        <div className={styles.outputs}>
          <div>
            <h2>{t.quiltTitle}</h2>
            <p>{t.quiltText}</p>
          </div>
          <div>
            <h2>{t.knitTitle}</h2>
            <p>{t.knitText}</p>
          </div>
          <div>
            <h2>{t.crochetTitle}</h2>
            <p>{t.crochetText}</p>
          </div>
        </div>
      </section>

      <section className="page">
        <h2 className={styles.heading}>{t.quiltHeading}</h2>
        <BlockGrid blocks={blocks} locale={locale} />
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>{t.knitHeading}</h2>
        <StitchGrid stitches={knitting} locale={locale} />
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>{t.crochetHeading}</h2>
        <StitchGrid stitches={crochet} locale={locale} />
      </section>
    </>
  );
}
