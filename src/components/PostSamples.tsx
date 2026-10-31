import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import { generatePattern, generateStitchPattern, getBlock, getStitchPattern } from "@/lib/generator";
import { parseState } from "@/lib/state";
import { parseStitchState } from "@/lib/stitchState";
import styles from "./Blog.module.css";

/** Draws a sample from the same settings its link opens with, so the two can't disagree. */
async function sampleSvg(sample: PostSample): Promise<string | null> {
  const params = new URLSearchParams(sample.query);
  if (sample.kind === "block") {
    const block = await getBlock(sample.slug);
    if (!block) return null;
    return (await generatePattern(block.slug, parseState(block, params))).svg[sample.view];
  }
  const stitch = await getStitchPattern(sample.kind, sample.slug);
  if (!stitch) return null;
  return (await generateStitchPattern(stitch.slug, parseStitchState(stitch, params))).svg[sample.view];
}

export async function PostSamples({ items }: { items: PostSample[] }) {
  const samples = await Promise.all(items.map(async (sample) => ({ sample, svg: await sampleSvg(sample) })));
  return (
    <ul className={styles.samples}>
      {samples.map(({ sample, svg }) =>
        svg ? (
          <li key={sampleHref(sample)}>
            <Link href={sampleHref(sample)} className={styles.sample}>
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
              <span className={styles.open}>Open with these settings</span>
            </Link>
          </li>
        ) : null,
      )}
    </ul>
  );
}
