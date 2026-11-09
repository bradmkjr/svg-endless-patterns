import type { Locale } from "@/lib/generator";
import { fill } from "@/lib/i18n";
import { SCRAP_PALETTES } from "@/lib/quiltState";
import copy from "@/i18n/messages/quilt.json";
import styles from "./ScrapBaskets.module.css";

type Basket = (typeof SCRAP_PALETTES)[number];

/** The scrap baskets, each a button that hands its colors to the builder: on a quilt and on a single block alike. */
export function ScrapBaskets({ locale, onApply }: { locale: Locale; onApply: (basket: Basket) => void }) {
  const t = copy[locale];
  return (
    <>
      <span className={styles.label}>{t.scrapBaskets}</span>
      <div className={styles.baskets}>
        {SCRAP_PALETTES.map((basket) => (
          <button key={basket.id} type="button" className={styles.basket} title={fill(t.useScraps, { name: t.scrapNames[basket.id] })} onClick={() => onApply(basket)}>
            <span aria-hidden>
              {basket.colors.map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </span>
            {t.scrapNames[basket.id]}
          </button>
        ))}
      </div>
    </>
  );
}
