import Link from "next/link";
import type { Locale, StitchInfo } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { CRAFT_PATHS } from "@/lib/stitchState";
import { thumbSrc } from "@/lib/toolOptions";
import styles from "./BlockGrid.module.css";

export function StitchGrid({ stitches, locale }: { stitches: StitchInfo[]; locale: Locale }) {
  return (
    <ul className={styles.grid}>
      {stitches.map((stitch) => (
        <li key={stitch.slug}>
          <Link href={localePath(locale, `${CRAFT_PATHS[stitch.craft]}/${stitch.slug}/`)} className={styles.card}>
            <span className={`art ${styles.art}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a small file, loaded as it nears the screen */}
              <img src={thumbSrc(stitch.craft, stitch.slug)} alt="" loading="lazy" width={200} height={200} />
            </span>
            <span className={styles.name}>{stitch.name}</span>
            <span className={styles.level}>{stitch.level}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
