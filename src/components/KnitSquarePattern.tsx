import type { Locale, StitchResult } from "@/lib/generator";
import copy from "@/i18n/messages/knitSquare.json";
import styles from "./BlockBuilder.module.css";

export const squareCopy = (locale: Locale) => copy[locale];

/** The full written pattern for a knitted square, in the order it's worked. */
export function KnitSquarePattern({ square, locale }: { square: NonNullable<StitchResult["square"]>; locale: Locale }) {
  return (
    <section className={styles.knitSquare}>
      <h2>{square.title}</h2>
      <p className={styles.note}>{squareCopy(locale).lede}</p>
      {square.sections.map((section) => (
        <div key={section.heading}>
          <h3>{section.heading}</h3>
          <ul className={styles.written}>
            {section.items.map((item, i) => (
              <li key={i}>
                {item.label && <strong>{item.label}: </strong>}
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
