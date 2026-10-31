import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { libraryTypes } from "@/lib/libraryTools";
import styles from "./PatternLibrary.module.css";

export async function PatternLibrary({ locale }: { locale: Locale }) {
  const t = messages(locale).library;
  const types = await libraryTypes(locale);
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      {types.map((type) => (
        <section key={type.id} className={styles.type}>
          <h2>
            <Link href={type.href}>{type.title}</Link>
          </h2>
          <p>{type.text}</p>
          <p>
            <strong>{t.usefulOutput}</strong> {type.output}
          </p>
          <ul className={styles.samples}>
            {type.samples.map((sample) => (
              <li key={sample.href}>
                <Link href={sample.href} className={styles.sample}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a static file, loaded as it nears the screen */}
                  <img src={sample.src} alt="" loading="lazy" width={160} height={160} />
                  <span>{sample.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={type.href} className={styles.more}>
            {type.total > type.samples.length ? fill(messages(locale).home.seeAll, { n: type.total }) : type.explore}
          </Link>
        </section>
      ))}
    </div>
  );
}
