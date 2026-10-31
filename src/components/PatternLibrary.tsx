import Link from "next/link";
import { generatePattern, generateStitchPattern, generateTartan, getBlock, getStitchPattern, type Locale } from "@/lib/generator";
import { defaultTartanState } from "@/lib/tartanState";
import { fill, localePath, messages } from "@/lib/i18n";
import { libraryTools } from "@/lib/libraryTools";
import { defaultState } from "@/lib/state";
import { defaultStitchState } from "@/lib/stitchState";
import styles from "./PatternLibrary.module.css";

async function stitchArtUrl(craft: "knit" | "crochet", slug: string, locale: Locale) {
  const stitch = (await getStitchPattern(craft, slug, locale))!;
  const { swatch } = (await generateStitchPattern(slug, defaultStitchState(stitch, locale))).svg;
  return { url: `data:image/svg+xml,${encodeURIComponent(swatch)}`, tileWidth: Number(/viewBox="0 0 ([\d.]+) /.exec(swatch)![1]), name: stitch.name };
}

export async function PatternLibrary({ locale }: { locale: Locale }) {
  const t = messages(locale).library;
  const href = (path: string) => localePath(locale, path);
  const ohio = (await getBlock("ohio-star", locale))!;
  const quilt = (await generatePattern(ohio.slug, defaultState(ohio, locale))).svg.block;
  const knit = await stitchArtUrl("knit", "seed-stitch", locale);
  const crochet = await stitchArtUrl("crochet", "mesh-stitch", locale);
  const tartan = (await generateTartan(defaultTartanState(locale))).svg.swatch;
  const tools = await libraryTools(locale);
  const swatch = (art: typeof knit) => (
    <div
      className={styles.art}
      role="img"
      aria-label={fill(t.swatchAlt, { name: art.name })}
      style={{ backgroundImage: `url("${art.url}")`, backgroundSize: `${(art.tileWidth / 4) * 100}% auto` }}
    />
  );
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={`art ${styles.art}`} dangerouslySetInnerHTML={{ __html: quilt }} />
          <span className={styles.status}>{t.available}</span>
          <h2>{t.quiltTitle}</h2>
          <p>{t.quiltText}</p>
          <p>
            <strong>{t.usefulOutput}</strong> {t.quiltOutput}
          </p>
          <Link href={href("/blocks/")}>{t.exploreQuilt}</Link>
        </article>
        <article className={styles.card}>
          {swatch(knit)}
          <span className={styles.status}>{t.available}</span>
          <h2>{t.knitTitle}</h2>
          <p>{t.knitText}</p>
          <p>
            <strong>{t.usefulOutput}</strong> {t.knitOutput}
          </p>
          <Link href={href("/knitting/")}>{t.exploreKnit}</Link>
        </article>
        <article className={styles.card}>
          {swatch(crochet)}
          <span className={styles.status}>{t.available}</span>
          <h2>{t.crochetTitle}</h2>
          <p>{t.crochetText}</p>
          <p>
            <strong>{t.usefulOutput}</strong> {t.crochetOutput}
          </p>
          <Link href={href("/crochet/")}>{t.exploreCrochet}</Link>
        </article>
        <article className={styles.card}>
          <div
            className={styles.art}
            role="img"
            aria-label={t.tartanTitle}
            style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tartan)}")`, backgroundSize: "100% auto", imageRendering: "pixelated" }}
          />
          <span className={styles.status}>{t.available}</span>
          <h2>{t.tartanTitle}</h2>
          <p>{t.tartanText}</p>
          <p>
            <strong>{t.usefulOutput}</strong> {t.tartanOutput}
          </p>
          <Link href={href("/tartans/")}>{t.exploreTartan}</Link>
        </article>
        {tools.map((tool) => {
          const text = (t.tools as Record<string, { title: string; text: string; output: string; explore: string } | undefined>)[tool.id];
          if (!text) return null;
          return (
            <article className={styles.card} key={tool.id}>
              {tool.svg ? (
                <div className={`art ${styles.art}`} role="img" aria-label={text.title} dangerouslySetInnerHTML={{ __html: tool.svg }} />
              ) : (
                <div className={styles.art} role="img" aria-label={text.title} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tool.tile!)}")`, backgroundSize: tool.tileSize ?? "50% auto" }} />
              )}
              <span className={styles.status}>{t.available}</span>
              <h2>{text.title}</h2>
              <p>{text.text}</p>
              <p>
                <strong>{t.usefulOutput}</strong> {text.output}
              </p>
              <Link href={href(tool.href)}>{text.explore}</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
