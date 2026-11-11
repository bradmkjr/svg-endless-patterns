import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { fill, localePath, messages } from "@/lib/i18n";
import { libraryTypes } from "@/lib/libraryTools";
import { activeSeason } from "@/lib/seasons";
import seasonal from "@/i18n/messages/seasonal.json";
import styles from "./PatternLibrary.module.css";

export async function PatternLibrary({ locale }: { locale: Locale }) {
  const t = messages(locale).library;
  const season = activeSeason();
  const types = await libraryTypes(locale, season);
  // The season's designs from every type, gathered up front: one band of them, a dozen at most.
  const inSeason = types.flatMap((type) => type.samples.filter((sample) => sample.seasonal)).slice(0, 12);
  const seasonText = season ? seasonal[locale].seasons[season.id] : undefined;
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      {season && seasonText && inSeason.length ? (
        <section className={styles.season}>
          <p className={styles.eyebrow}>{t.seasonNow}</p>
          <h2>
            <Link href={localePath(locale, `/seasonal/${season.id}/`)}>{seasonText.h1}</Link>
          </h2>
          <p>{seasonText.summary}</p>
          <ul className={styles.samples}>
            {inSeason.map((sample) => (
              <li key={sample.href}>
                <Link href={sample.href} className={styles.sample}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a static file, loaded as it nears the screen */}
                  <img src={sample.src} alt="" loading="lazy" width={160} height={160} />
                  <span>{sample.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={localePath(locale, `/seasonal/${season.id}/`)} className={styles.more}>
            {t.seasonLink}
          </Link>
        </section>
      ) : null}
      {types.map((type) => (
        <section key={type.href} className={styles.type}>
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
