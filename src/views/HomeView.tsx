import type { Metadata } from "next";
import Link from "next/link";
import { BlockGrid } from "@/components/BlockGrid";
import { StitchGrid } from "@/components/StitchGrid";
import type { Locale } from "@/lib/generator";
import { getBlocks, getStitchPatterns } from "@/lib/patternCatalog";
import { fill, localePath, messages } from "@/lib/i18n";
import { libraryTypes } from "@/lib/libraryTools";
import { pageMetadata } from "@/lib/pageMetadata";
import { SITE_NAME } from "@/lib/site";
import { thumbSrc } from "@/lib/toolOptions";
import styles from "./HomeView.module.css";

/** Patterns shown per craft: the rest are a click away. */
const ROW = 8;

export function homeMetadata(locale: Locale): Metadata {
  const t = messages(locale).meta;
  const title = `${SITE_NAME}: ${t.defaultTitle}`;
  return { ...pageMetadata(locale, "/", title, t.description), title: { absolute: title } };
}

export async function HomeView({ locale }: { locale: Locale }) {
  const t = messages(locale).home;
  const blocks = await getBlocks(locale);
  const knitting = await getStitchPatterns("knit", locale);
  const crochet = await getStitchPatterns("crochet", locale);
  const types = await libraryTypes(locale);

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
        <div className={`art ${styles.quilt}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a standard image tag from the API */}
          <img src={thumbSrc("blocks", "log-cabin-layout")} alt="" width={1000} height={1000} />
        </div>
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
        <h2 className={styles.heading}>{t.typesHeading}</h2>
        <ul className={styles.types}>
          {types.map((type) => (
            <li key={type.id}>
              <Link href={type.href} className={styles.type}>
                <span className={styles.typeArt}>
                  {type.samples.slice(0, 4).map((sample) => (
                    // eslint-disable-next-line @next/next/no-img-element -- a static file, loaded as it nears the screen
                    <img key={sample.src} src={sample.src} alt="" loading="lazy" width={120} height={120} />
                  ))}
                </span>
                <strong>{type.title}</strong>
                <span className={styles.typeCount}>{fill(t.seeAll, { n: type.total })}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>{t.quiltHeading}</h2>
        <BlockGrid blocks={blocks.slice(0, ROW)} locale={locale} />
        <Link href={localePath(locale, "/blocks/")} className={styles.more}>
          {fill(t.seeAll, { n: blocks.length })}
        </Link>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>{t.knitHeading}</h2>
        <StitchGrid stitches={knitting.slice(0, ROW)} locale={locale} />
        <Link href={localePath(locale, "/knitting/")} className={styles.more}>
          {fill(t.seeAll, { n: knitting.length })}
        </Link>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>{t.crochetHeading}</h2>
        <StitchGrid stitches={crochet.slice(0, ROW)} locale={locale} />
        <Link href={localePath(locale, "/crochet/")} className={styles.more}>
          {fill(t.seeAll, { n: crochet.length })}
        </Link>
      </section>
    </>
  );
}
