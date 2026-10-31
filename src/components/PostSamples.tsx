import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import { generatePattern, generateStitchPattern, getBlock, getStitchPattern, type Craft, type Locale } from "@/lib/generator";
import { CrochetColorworkSample } from "./CrochetColorworkSample";
import { CheckerboardSample } from "./CheckerboardSample";
import { FractalSample } from "./FractalSample";
import { KnitColorworkSample } from "./KnitColorworkSample";
import { MazeSample } from "./MazeSample";
import { ToolSample } from "./ToolSample";
import { isApiSample } from "@/lib/toolSamples";
import { messages } from "@/lib/i18n";
import { parseState } from "@/lib/state";
import { parseStitchState } from "@/lib/stitchState";
import styles from "./Blog.module.css";

/** Draws a sample from the same settings its link opens with, so the two can't disagree. */
async function sampleSvg(sample: PostSample, locale: Locale): Promise<string | null> {
  if (sample.kind === "maze") return null;
  const params = new URLSearchParams(sample.query);
  if (sample.kind === "fractal" || sample.kind === "knitColorwork" || sample.kind === "crochetColorwork" || sample.kind === "checkerboard") return null;
  if (sample.kind === "block") {
    const block = await getBlock(sample.slug, locale);
    if (!block) return null;
    return (await generatePattern(block.slug, parseState(block, params, locale))).svg[sample.view];
  }
  const stitch = await getStitchPattern(sample.kind as Craft, sample.slug, locale);
  if (!stitch) return null;
  return (await generateStitchPattern(stitch.slug, parseStitchState(stitch, params, locale))).svg[sample.view as "swatch" | "chart"];
}

export async function PostSamples({ items, locale }: { items: PostSample[]; locale: Locale }) {
  const t = messages(locale).blog;
  const samples = await Promise.all(items.map(async (sample) => ({
    sample,
    svg: sample.kind === "maze" || sample.kind === "fractal" || sample.kind === "knitColorwork" || sample.kind === "crochetColorwork" || sample.kind === "checkerboard" || isApiSample(sample) ? null : await sampleSvg(sample, sample.locale ?? locale),
  })));
  return (
    <ul className={styles.samples}>
      {samples.map(({ sample, svg }) =>
        sample.kind === "maze" ? (
          <MazeSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "checkerboard" ? (
          <CheckerboardSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "crochetColorwork" ? (
          <CrochetColorworkSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "knitColorwork" ? (
          <KnitColorworkSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "fractal" ? (
          <FractalSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : isApiSample(sample) ? (
          <ToolSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : svg ? (
          <li key={sampleHref(sample, locale)}>
            <Link href={sampleHref(sample, locale)} className={styles.sample}>
              {sample.view === "swatch" ? (
                // A swatch is a small repeating tile: show 4" of it, as the stitch pages do.
                <span
                  className={styles.sampleArt}
                  style={{
                    aspectRatio: "1",
                    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
                    backgroundSize: `${(Number(/viewBox="0 0 ([\d.]+) /.exec(svg)?.[1] ?? 4) / 4) * 100}% auto`,
                  }}
                />
              ) : (
                <span className={`art ${styles.sampleArt}`} dangerouslySetInnerHTML={{ __html: svg }} />
              )}
              <span className={styles.caption}>{sample.caption}</span>
              <span className={styles.open}>{t.openSample}</span>
            </Link>
          </li>
        ) : null,
      )}
    </ul>
  );
}
