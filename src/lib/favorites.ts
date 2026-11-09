import { useSyncExternalStore } from "react";
import type { PostSample } from "./content";

/**
 * Patterns a visitor hearts, kept in this browser's local storage like saved palettes. Each
 * keeps the settings its builder had, colors and all, so opening it brings back exactly that.
 */

export type FavoriteKind = "block" | "quilt" | "knit" | "crochet";
export type Favorite = {
  id: string;
  kind: FavoriteKind;
  /** The pattern's slug: a block, stitch or quilt design. */
  slug: string;
  name: string;
  /** The builder's query string when it was saved, colors included. A quilt's carries its seed, so its scraps fall the same way. */
  query: string;
  /** The colors, to show beside it. */
  colors: string[];
  savedAt: number;
};

const KEY = "endless-patterns:favorites:v1";
const KINDS: FavoriteKind[] = ["block", "quilt", "knit", "crochet"];
const MAX_FAVORITES = 200;
const NONE: Favorite[] = [];

/** What's stored can be old or hand-edited, so anything that doesn't read is dropped. */
export function readFavorites(raw: string | null): Favorite[] {
  if (!raw) return NONE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NONE;
  }
  if (!Array.isArray(parsed)) return NONE;
  return parsed
    .filter(
      (f): f is Favorite =>
        typeof f?.id === "string" &&
        KINDS.includes(f.kind) &&
        typeof f.slug === "string" &&
        /^[a-z0-9-]{1,60}$/.test(f.slug) &&
        typeof f.name === "string" &&
        typeof f.query === "string" &&
        f.query.length < 2000 &&
        Array.isArray(f.colors) &&
        f.colors.every((c: unknown) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)) &&
        typeof f.savedAt === "number",
    )
    .map((f) => ({ id: f.id, kind: f.kind, slug: f.slug, name: f.name.slice(0, 80), query: f.query, colors: f.colors.slice(0, 8), savedAt: f.savedAt }))
    .slice(0, MAX_FAVORITES);
}

let cachedRaw: string | null = null;
let cached = NONE;
const listeners = new Set<() => void>();

function snapshot(): Favorite[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return NONE;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readFavorites(raw);
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Returns false if the browser refused to store them. */
function write(favorites: Favorite[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(favorites));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

/** Newest first. Before the browser has read storage, there are none. */
export function useFavorites(): Favorite[] {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}

/** Two saves are the same favorite when they're the same pattern with the same settings. */
export const sameFavorite = (a: Pick<Favorite, "kind" | "slug" | "query">, b: Pick<Favorite, "kind" | "slug" | "query">) => a.kind === b.kind && a.slug === b.slug && a.query === b.query;

export function addFavorite(favorite: Omit<Favorite, "id" | "savedAt">): boolean {
  const rest = snapshot().filter((f) => !sameFavorite(f, favorite));
  return write([{ ...favorite, id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, savedAt: Date.now() }, ...rest].slice(0, MAX_FAVORITES));
}

export function removeFavorite(id: string): boolean {
  return write(snapshot().filter((f) => f.id !== id));
}

/** A favorite as a sample, so it's drawn by the API in its own colors and links back to its builder. */
export function favoriteSample(favorite: Favorite): PostSample {
  const { kind, slug, query, name } = favorite;
  if (kind === "quilt") return { kind, slug, query, view: "quilt", caption: name };
  if (kind === "block") return { kind, slug, query, view: "block", caption: name };
  return { kind, slug, query, view: "swatch", caption: name };
}
