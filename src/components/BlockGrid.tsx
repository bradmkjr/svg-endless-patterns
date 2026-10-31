import Link from "next/link";
import { generatePattern, type BlockInfo, type Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { defaultState } from "@/lib/state";
import styles from "./BlockGrid.module.css";

export async function BlockGrid({ blocks, locale }: { blocks: BlockInfo[]; locale: Locale }) {
  const cards = await Promise.all(
    blocks.map(async (block) => ({ block, svg: (await generatePattern(block.slug, { ...defaultState(block, locale), cols: 1, rows: 1, border: 0, seams: true })).svg.block })),
  );
  return (
    <ul className={styles.grid}>
      {cards.map(({ block, svg }) => (
        <li key={block.slug}>
          <Link href={localePath(locale, `/blocks/${block.slug}/`)} className={styles.card}>
            <span className={`art ${styles.art}`} dangerouslySetInnerHTML={{ __html: svg }} />
            <span className={styles.name}>{block.name}</span>
            <span className={styles.level}>{block.level}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
