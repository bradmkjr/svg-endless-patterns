import Link from "next/link";
import { BlockGrid } from "@/components/BlockGrid";
import { generatePattern, getBlock, getBlocks } from "@/lib/generator";
import { defaultState } from "@/lib/state";
import styles from "./page.module.css";

export default async function HomePage() {
  const blocks = await getBlocks();
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
          <h1>Your quilt, worked out to the eighth of an inch</h1>
          <p className="lede">
            Pick a traditional block, choose its size and colors, and get everything you need to make it: a cutting list,
            yardage, and templates you can print.
          </p>
          <Link href="/blocks/" className={styles.cta}>
            Choose a block
          </Link>
        </div>
        <div className={`art ${styles.quilt}`} dangerouslySetInnerHTML={{ __html: hero.svg.quilt }} />
      </section>

      <section className={styles.band}>
        <div className={styles.outputs}>
          <div>
            <h2>Cutting list</h2>
            <p>Every piece for one block or the whole quilt, using standard rotary-cutting sizes.</p>
          </div>
          <div>
            <h2>Fabric to buy</h2>
            <p>Yardage for each fabric, including sashing, borders, backing and binding.</p>
          </div>
          <div>
            <h2>Files to keep</h2>
            <p>Seamless SVG and PNG repeats, plus a printable PDF with true-size templates.</p>
          </div>
        </div>
      </section>

      <section className="page">
        <h2 className={styles.heading}>Start with a block</h2>
        <BlockGrid blocks={blocks} />
      </section>
    </>
  );
}
