import Link from "next/link";
import { generatePattern, type BlockInfo } from "@/lib/generator";
import { defaultState } from "@/lib/state";
import styles from "./BlockGrid.module.css";

export async function BlockGrid({ blocks }: { blocks: BlockInfo[] }) {
  const cards = await Promise.all(
    blocks.map(async (block) => ({ block, svg: (await generatePattern(block.slug, { ...defaultState(block), cols: 1, rows: 1, border: 0 })).svg.block })),
  );
  return (
    <ul className={styles.grid}>
      {cards.map(({ block, svg }) => (
        <li key={block.slug}>
          <Link href={`/blocks/${block.slug}/`} className={styles.card}>
            <span className={`art ${styles.art}`} dangerouslySetInnerHTML={{ __html: svg }} />
            <span className={styles.name}>{block.name}</span>
            <span className={styles.level}>{block.level}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
