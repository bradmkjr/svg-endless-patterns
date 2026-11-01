import Link from "next/link";
import type { BlockInfo, Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { thumbSrc } from "@/lib/toolOptions";
import styles from "./BlockGrid.module.css";

export function BlockGrid({ blocks, locale }: { blocks: BlockInfo[]; locale: Locale }) {
  return (
    <ul className={styles.grid}>
      {blocks.map((block) => (
        <li key={block.slug}>
          <Link href={localePath(locale, `/blocks/${block.slug}/`)} className={styles.card}>
            <span className={`art ${styles.art}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small file, loaded as it nears the screen */}
              <img src={thumbSrc("blocks", block.slug)} alt="" loading="lazy" width={200} height={200} />
            </span>
            <span className={styles.name}>{block.name}</span>
            <span className={styles.level}>{block.level}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
