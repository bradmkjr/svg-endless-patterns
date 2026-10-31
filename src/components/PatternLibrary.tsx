import Link from "next/link";
import { generatePattern, generateStitchPattern, getBlock, getStitchPattern } from "@/lib/generator";
import { PATTERN_PAGES, type PatternPage as PatternPageData } from "@/lib/patternPages";
import { publicPath } from "@/lib/site";
import { defaultState } from "@/lib/state";
import { defaultStitchState } from "@/lib/stitchState";
import styles from "./PatternLibrary.module.css";

function StaticSample({ page, className }: { page: PatternPageData; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a plain SVG file in public/
    <img src={publicPath(`/samples/${page.slug}.svg`)} alt={page.sampleAlt} className={className} loading="lazy" />
  );
}

async function stitchArtUrl(craft: "knit" | "crochet", slug: string) {
  const stitch = (await getStitchPattern(craft, slug))!;
  const { swatch } = (await generateStitchPattern(slug, defaultStitchState(stitch))).svg;
  return { url: `data:image/svg+xml,${encodeURIComponent(swatch)}`, tileWidth: Number(/viewBox="0 0 ([\d.]+) /.exec(swatch)![1]), name: stitch.name };
}

export async function PatternLibrary() {
  const ohio = (await getBlock("ohio-star"))!;
  const quilt = (await generatePattern(ohio.slug, defaultState(ohio))).svg.block;
  const knit = await stitchArtUrl("knit", "seed-stitch");
  const crochet = await stitchArtUrl("crochet", "mesh-stitch");
  const swatch = (art: typeof knit) => (
    <div
      className={styles.art}
      role="img"
      aria-label={`Illustration of ${art.name}`}
      style={{ backgroundImage: `url("${art.url}")`, backgroundSize: `${(art.tileWidth / 4) * 100}% auto` }}
    />
  );
  return (
    <div className="page">
      <h1>Pattern library</h1>
      <p className="lede">
        Explore traditional and geometric patterns across crafts. Quilt blocks, knitting, and crochet have working
        pattern tools; the other pattern makers are planned.
      </p>
      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={`art ${styles.art}`} dangerouslySetInnerHTML={{ __html: quilt }} />
          <span className={styles.status}>Available</span>
          <h2>Quilt blocks</h2>
          <p>Choose a traditional block and customize its size, colors, layout, and sashing.</p>
          <p>
            <strong>Useful output:</strong> Cutting list, yardage, and printable templates.
          </p>
          <Link href="/blocks/">Explore quilt blocks</Link>
        </article>
        <article className={styles.card}>
          {swatch(knit)}
          <span className={styles.status}>Available</span>
          <h2>Knitting stitches</h2>
          <p>Choose a stitch and set your project size and gauge.</p>
          <p>
            <strong>Useful output:</strong> Starting count, written rows, chart, and yarn estimate.
          </p>
          <Link href="/knitting/">Explore knitting stitches</Link>
        </article>
        <article className={styles.card}>
          {swatch(crochet)}
          <span className={styles.status}>Available</span>
          <h2>Crochet stitches</h2>
          <p>Choose a stitch and set your project size and gauge.</p>
          <p>
            <strong>Useful output:</strong> Starting chain, US-term instructions, symbol chart, and yarn estimate.
          </p>
          <Link href="/crochet/">Explore crochet stitches</Link>
        </article>
        {PATTERN_PAGES.map((page) => (
          <article className={styles.card} key={page.slug}>
            <StaticSample page={page} className={styles.art} />
            <span className={styles.status}>Coming soon</span>
            <h2>{page.title}</h2>
            <p>{page.summary}</p>
            <p>
              <strong>Customize:</strong> {page.customize}
            </p>
            <p>
              <strong>Useful output:</strong> {page.output}
            </p>
            <Link href={`/patterns/${page.slug}/`}>What&apos;s planned for {page.title}</Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PatternDetail({ page }: { page: PatternPageData }) {
  return (
    <div className="page">
      <p className={styles.breadcrumb}>
        <Link href="/patterns/">Pattern library</Link>
      </p>
      <span className={styles.status}>Coming soon</span>
      <h1>{page.title}</h1>
      <p className="lede">{page.summary}</p>
      <figure className={styles.figure}>
        <StaticSample page={page} className={styles.figureArt} />
        <figcaption>A static example of the style. You can&apos;t customize it yet.</figcaption>
      </figure>
      <section className={styles.details}>
        <div>
          <h2>What you&apos;ll customize</h2>
          <p>{page.customize}</p>
        </div>
        <div>
          <h2>Useful output</h2>
          <p>{page.output}</p>
        </div>
      </section>
      <p className={styles.note}>
        This is a preview of a planned pattern maker. Its customization and export tools are not available yet.
      </p>
    </div>
  );
}
