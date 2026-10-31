import Link from "next/link";
import { BlockGrid } from "@/components/BlockGrid";
import { StitchGrid } from "@/components/StitchGrid";
import { generatePattern, getBlock, getBlocks, getStitchPatterns } from "@/lib/generator";
import { defaultState } from "@/lib/state";
import styles from "./page.module.css";

export default async function HomePage() {
  const blocks = await getBlocks();
  const knitting = await getStitchPatterns("knit");
  const crochet = await getStitchPatterns("crochet");
  const logCabin = (await getBlock("log-cabin"))!;
  const hero = await generatePattern(logCabin.slug, {
    ...defaultState(logCabin),
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
          <h1>Traditional patterns, worked out for what you&apos;re making</h1>
          <p className="lede">
            Choose a quilt block or a knit or crochet stitch, set your size, and get the numbers and instructions to
            make it, ready to print.
          </p>
          <Link href="/blocks/" className={styles.cta}>
            Start with a quilt block
          </Link>
        </div>
        <div className={`art ${styles.quilt}`} dangerouslySetInnerHTML={{ __html: hero.svg.quilt }} />
      </section>

      <section className={styles.band}>
        <div className={styles.outputs}>
          <div>
            <h2>Quilting</h2>
            <p>Cutting lists, yardage, seamless repeats and true-size templates for each block.</p>
          </div>
          <div>
            <h2>Knitting</h2>
            <p>Cast-on counts and written rows that match your gauge, with a chart for every stitch.</p>
          </div>
          <div>
            <h2>Crochet</h2>
            <p>Starting chains, row-by-row instructions in US terms, and symbol charts.</p>
          </div>
        </div>
      </section>

      <section className="page">
        <h2 className={styles.heading}>Quilt blocks</h2>
        <BlockGrid blocks={blocks} />
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>Knitting stitches</h2>
        <StitchGrid stitches={knitting} />
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <h2 className={styles.heading}>Crochet stitches</h2>
        <StitchGrid stitches={crochet} />
      </section>
    </>
  );
}
