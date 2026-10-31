import { useSyncExternalStore } from "react";

/** The palettes a visitor saves, kept in this browser's local storage. */

export type CustomPalette = { id: string; name: string; colors: string[] };

const KEY = "endless-patterns:palettes:v1";
export const MAX_NAME = 40;
export const MIN_PALETTE_COLORS = 2;
export const MAX_PALETTE_COLORS = 8;
const MAX_PALETTES = 200;
const NONE: CustomPalette[] = [];

/** What's stored can be old or hand-edited, so anything that doesn't read is dropped. */
export function readPalettes(raw: string | null): CustomPalette[] {
  if (!raw) return NONE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NONE;
  }
  if (!Array.isArray(parsed)) return NONE;
  return parsed
    .filter((p): p is CustomPalette => {
      const colors = p?.colors;
      return typeof p?.id === "string" && typeof p?.name === "string" && p.name.trim() !== "" && Array.isArray(colors) && colors.length >= MIN_PALETTE_COLORS && colors.length <= MAX_PALETTE_COLORS && colors.every((c: unknown) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c));
    })
    .map((p) => ({ id: p.id, name: p.name.slice(0, MAX_NAME), colors: p.colors.map((c) => c.toLowerCase()) }))
    .slice(0, MAX_PALETTES);
}

let cachedRaw: string | null = null;
let cached = NONE;
const listeners = new Set<() => void>();

function snapshot(): CustomPalette[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return NONE;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readPalettes(raw);
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
function write(palettes: CustomPalette[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(palettes));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

export function useCustomPalettes(): CustomPalette[] {
  return useSyncExternalStore(subscribe, snapshot, () => NONE);
}

export function savePalette(name: string, colors: string[]): boolean {
  const clean = name.trim().slice(0, MAX_NAME);
  const unique = colors.slice(0, MAX_PALETTE_COLORS).map((c) => c.toLowerCase());
  if (!clean || unique.length < MIN_PALETTE_COLORS) return false;
  return write([{ id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: clean, colors: unique }, ...snapshot()].slice(0, MAX_PALETTES));
}

export function deletePalette(id: string): boolean {
  return write(snapshot().filter((p) => p.id !== id));
}

export function renamePalette(id: string, name: string): boolean {
  const clean = name.trim().slice(0, MAX_NAME);
  return !!clean && write(snapshot().map((p) => (p.id === id ? { ...p, name: clean } : p)));
}
