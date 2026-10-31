import Link from "next/link";
import { PATTERN_PAGES, type PatternPage as PatternPageData } from "@/lib/patternPages";
import styles from "./PatternLibrary.module.css";

export function PatternLibrary() {
  return (
    <div className="page">
      <h1>Pattern library</h1>
      <p className="lede">
        Explore traditional and geometric patterns across crafts. Quilt blocks, knitting, and crochet have working
        pattern tools; the other pattern makers are planned.
      </p>
      <div className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.status}>Available</span>
          <h2>Quilt blocks</h2>
          <p>Choose a traditional block and customize its size, colors, layout, and sashing.</p>
          <p>
            <strong>Useful output:</strong> Cutting list, yardage, and printable templates.
          </p>
          <Link href="/blocks/">Explore quilt blocks</Link>
        </article>
        <article className={styles.card}>
          <span className={styles.status}>Available</span>
          <h2>Knitting stitches</h2>
          <p>Choose a stitch and set your project size and gauge.</p>
          <p>
            <strong>Useful output:</strong> Starting count, written rows, chart, and yarn estimate.
          </p>
          <Link href="/knitting/">Explore knitting stitches</Link>
        </article>
        <article className={styles.card}>
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
