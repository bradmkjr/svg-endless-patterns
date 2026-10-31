import Link from "next/link";
import { generateStitchPattern, type StitchInfo } from "@/lib/generator";
import { CRAFT_PATHS, defaultStitchState } from "@/lib/stitchState";
import styles from "./BlockGrid.module.css";

export async function StitchGrid({ stitches }: { stitches: StitchInfo[] }) {
  const cards = await Promise.all(
    stitches.map(async (stitch) => {
      const { swatch } = (await generateStitchPattern(stitch.slug, defaultStitchState(stitch))).svg;
      return { stitch, url: `data:image/svg+xml,${encodeURIComponent(swatch)}`, size: /viewBox="0 0 ([\d.]+) /.exec(swatch)![1] };
    }),
  );
  return (
    <ul className={styles.grid}>
      {cards.map(({ stitch, url, size }) => (
        <li key={stitch.slug}>
          <Link href={`${CRAFT_PATHS[stitch.craft]}/${stitch.slug}/`} className={styles.card}>
            {/* Every card shows 4" of fabric, so scales compare directly. */}
            <span className={styles.art} style={{ aspectRatio: "1", backgroundImage: `url("${url}")`, backgroundSize: `${(Number(size) / 4) * 100}% auto` }} />
            <span className={styles.name}>{stitch.name}</span>
            <span className={styles.level}>{stitch.level}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
