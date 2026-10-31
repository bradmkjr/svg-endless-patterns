import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import { generatePattern, generateStitchPattern, generateCrossStitch, generateNeedlepoint, generateTessellation, generateSashiko, generateCelticKnot, generateStainedGlass, generateMandala, generateGirih, generateTruchet, generateTieDye, generateTartan, getBlock, getStitchPattern, type Locale } from "@/lib/generator";
import { CrochetColorworkSample } from "./CrochetColorworkSample";
import { CheckerboardSample } from "./CheckerboardSample";
import { FractalSample } from "./FractalSample";
import { KnitColorworkSample } from "./KnitColorworkSample";
import { MazeSample } from "./MazeSample";
import { messages } from "@/lib/i18n";
import { parseState } from "@/lib/state";
import { parseStitchState } from "@/lib/stitchState";
import { parseCrossStitchState } from "@/lib/crossStitchState";
import { parseNeedlepointState } from "@/lib/needlepointState";
import { parseTessellationState } from "@/lib/tessellationState";
import { parseSashikoState } from "@/lib/sashikoState";
import { parseCelticKnotState } from "@/lib/celticKnotState";
import { parseStainedGlassState } from "@/lib/stainedGlassState";
import { parseMandalaState } from "@/lib/mandalaState";
import { parseGirihState } from "@/lib/girihState";
import { parseTruchetState } from "@/lib/truchetState";
import { parseTieDyeState } from "@/lib/tieDyeState";
import { parseTartanState } from "@/lib/tartanState";
import styles from "./Blog.module.css";

/** Draws a sample from the same settings its link opens with, so the two can't disagree. */
async function sampleSvg(sample: PostSample, locale: Locale): Promise<string | null> {
  if (sample.kind === "maze") return null;
  const params = new URLSearchParams(sample.query);
  if (sample.kind === "crossStitch") return (await generateCrossStitch(parseCrossStitchState(params, locale))).svg[sample.view];
  if (sample.kind === "needlepoint") return (await generateNeedlepoint(parseNeedlepointState(params, locale))).svg[sample.view];
  if (sample.kind === "tessellation") return (await generateTessellation(parseTessellationState(params, locale))).svg[sample.view];
  if (sample.kind === "sashiko") return (await generateSashiko(parseSashikoState(params, locale))).svg[sample.view];
  if (sample.kind === "celtic") return (await generateCelticKnot(parseCelticKnotState(params, locale))).svg[sample.view];
  if (sample.kind === "stainedGlass") return (await generateStainedGlass(parseStainedGlassState(params, locale))).svg[sample.view];
  if (sample.kind === "mandala") return (await generateMandala(parseMandalaState(params, locale))).svg[sample.view];
  if (sample.kind === "girih") return (await generateGirih(parseGirihState(params, locale))).svg[sample.view];
  if (sample.kind === "fractal" || sample.kind === "knitColorwork" || sample.kind === "crochetColorwork" || sample.kind === "checkerboard") return null;
  if (sample.kind === "tieDye") return (await generateTieDye(parseTieDyeState(params, locale))).svg[sample.view];
  if (sample.kind === "truchet") return (await generateTruchet(parseTruchetState(params, locale))).svg[sample.view];
  if (sample.kind === "tartan") return (await generateTartan(parseTartanState(params, locale))).svg.swatch;
  if (sample.kind === "block") {
    const block = await getBlock(sample.slug, locale);
    if (!block) return null;
    return (await generatePattern(block.slug, parseState(block, params, locale))).svg[sample.view];
  }
  const stitch = await getStitchPattern(sample.kind, sample.slug, locale);
  if (!stitch) return null;
  return (await generateStitchPattern(stitch.slug, parseStitchState(stitch, params, locale))).svg[sample.view];
}

export async function PostSamples({ items, locale }: { items: PostSample[]; locale: Locale }) {
  const t = messages(locale).blog;
  const samples = await Promise.all(items.map(async (sample) => ({
    sample,
    svg: sample.kind === "maze" || sample.kind === "fractal" || sample.kind === "knitColorwork" || sample.kind === "crochetColorwork" || sample.kind === "checkerboard" ? null : await sampleSvg(sample, sample.locale ?? locale),
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
