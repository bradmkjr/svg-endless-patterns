"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleHref } from "@/lib/content";
import { favoriteSample, removeFavorite, useFavorites, type Favorite, type FavoriteKind } from "@/lib/favorites";
import type { Locale } from "@/lib/generator";
import { fill } from "@/lib/i18n";
import { drawSample } from "@/lib/toolSamples";
import copy from "@/i18n/messages/favorites.json";
import status from "@/i18n/messages/apiStatus.json";
import styles from "./Favorites.module.css";

/** One favorite, drawn by the API in its own colors. */
function FavoriteCard({ favorite, locale }: { favorite: Favorite; locale: Locale }) {
  const t = copy[locale];
  const sample = favoriteSample(favorite);
  const key = `${favorite.kind}:${favorite.slug}:${favorite.query}:${locale}`;
  const [drawn, setDrawn] = useState<{ key: string; svg: string } | null>(null);
  useEffect(() => {
    let stale = false;
    drawSample(favoriteSample(favorite), locale).then(
      (svg) => {
        if (!stale) setDrawn({ key, svg });
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [key, favorite, locale]);
  const svg = drawn?.key === key ? drawn.svg : "";
  return (
    <li className={styles.item}>
      <Link href={sampleHref(sample, locale)} className={styles.card}>
        {!svg ? (
          <span className={styles.art} role="status">
            {status[locale].loading}
          </span>
        ) : sample.view === "swatch" ? (
          <span className={styles.art} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: `${(Number(/viewBox="0 0 ([\d.]+) /.exec(svg)?.[1] ?? 4) / 4) * 100}% auto` }} />
        ) : (
          <span className={styles.art} dangerouslySetInnerHTML={{ __html: svg }} />
        )}
        <span className={styles.name}>{favorite.name}</span>
        <span className={styles.swatches} aria-hidden>
          {favorite.colors.map((color, i) => (
            <span key={`${color}-${i}`} style={{ background: color }} />
          ))}
        </span>
      </Link>
      <button type="button" className={styles.remove} aria-label={fill(t.remove, { name: favorite.name })} title={fill(t.remove, { name: favorite.name })} onClick={() => removeFavorite(favorite.id)}>
        ×
      </button>
    </li>
  );
}

/** The visitor's hearted patterns of these kinds, at the top of a page. Nothing at all until there are some. */
export function FavoritesShelf({ locale, kinds }: { locale: Locale; kinds: FavoriteKind[] }) {
  const t = copy[locale];
  const favorites = useFavorites().filter((f) => kinds.includes(f.kind));
  if (!favorites.length) return null;
  return (
    <section className={`${styles.shelf} no-print`} aria-labelledby="favorites-heading">
      <h2 id="favorites-heading">{t.shelfTitle}</h2>
      <p className={styles.shelfNote}>{t.shelfNote}</p>
      <ul className={styles.list}>
        {favorites.map((favorite) => (
          <FavoriteCard key={favorite.id} favorite={favorite} locale={locale} />
        ))}
      </ul>
    </section>
  );
}
