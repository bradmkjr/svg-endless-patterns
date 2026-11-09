import Link from "next/link";
import type { Locale } from "@/lib/generator";
import copy from "@/i18n/messages/quilt.json";
import styles from "./QuiltPromo.module.css";

/**
 * A banner on a block's page that opens the quilt planner with this block in the first spot,
 * in the same colors, size and layout, and shows the whole quilt it will open with.
 */
export function QuiltPromo({ href, quiltSvg, locale }: { href: string; quiltSvg: string | undefined; locale: Locale }) {
  const t = copy[locale];
  return (
    <aside className={`${styles.promo} no-print`} aria-labelledby="quilt-promo">
      {/* The picture opens the planner too; the button is the one in the tab order. */}
      <Link href={href} className={styles.preview} tabIndex={-1} aria-hidden>
        {quiltSvg ? <span dangerouslySetInnerHTML={{ __html: quiltSvg }} /> : <span className={styles.empty} />}
      </Link>
      <div className={styles.body}>
        <h2 id="quilt-promo">{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <Link href={href} className={styles.button}>
          {t.ctaButton}
          <span className={styles.arrow} aria-hidden>
            →
          </span>
        </Link>
      </div>
    </aside>
  );
}
