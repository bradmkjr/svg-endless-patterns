"use client";

import { addFavorite, removeFavorite, sameFavorite, useFavorites, type FavoriteKind } from "@/lib/favorites";
import type { Locale } from "@/lib/generator";
import copy from "@/i18n/messages/favorites.json";
import styles from "./Favorites.module.css";

/** A heart, filled when this pattern with these settings is already a favorite. */
export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Hearts the builder's current design, colors and all, or un-hearts it. Says what happened through `onStatus`. */
export function FavoriteButton({ kind, slug, name, query, colors, locale, onStatus }: { kind: FavoriteKind; slug: string; name: string; query: string; colors: string[]; locale: Locale; onStatus?: (text: string) => void }) {
  const t = copy[locale];
  const favorites = useFavorites();
  const saved = favorites.find((f) => sameFavorite(f, { kind, slug, query }));
  const toggle = () => {
    const ok = saved ? removeFavorite(saved.id) : addFavorite({ kind, slug, name, query, colors });
    onStatus?.(!ok ? t.storageError : saved ? t.removedStatus : t.savedStatus);
  };
  return (
    <button type="button" className={styles.heart} aria-pressed={!!saved} title={saved ? t.unsave : t.save} onClick={toggle}>
      <HeartIcon filled={!!saved} />
      {saved ? t.saved : t.save}
    </button>
  );
}
