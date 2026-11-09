import type { Locale } from "./patternTypes";

/**
 * Inches or a pattern written in metric, for the quilt tools. English opens in inches and every
 * other language in centimeters; a link names its units only when they differ from its language's.
 * The API works out the cuts and writes every measurement it returns with its unit.
 */
export type Units = "in" | "cm";
export const UNIT_OPTIONS: Units[] = ["in", "cm"];

export const defaultUnits = (locale: Locale = "en"): Units => (locale === "en" ? "in" : "cm");

const steps = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 100) / 100);

/** The choices each system offers, matching the API's, and what a new block starts at. */
export const MEASURES: Record<Units, { size: number[]; sashing: number[]; border: number[]; wof: number[]; blockSize: number; border0: number; wof0: number; ruler: number }> = {
  in: { size: steps(3, 24, 0.5), sashing: steps(0, 6, 0.5), border: steps(0, 12, 0.5), wof: steps(38, 44, 1), blockSize: 12, border0: 3, wof0: 40, ruler: 1 / 8 },
  cm: { size: steps(8, 60, 0.5), sashing: steps(0, 15, 0.5), border: steps(0, 30, 0.5), wof: steps(96, 112, 1), blockSize: 30, border0: 7.5, wof0: 105, ruler: 0.5 },
};

const PER_INCH: Record<Units, number> = { in: 1, cm: 2.54 };

const nearest = (value: number, options: number[]) => options.reduce((best, option) => (Math.abs(option - value) < Math.abs(best - value) ? option : best), options[0]!);

/**
 * A length in the other system, at the nearest choice that system offers. For a block size, `grids`
 * lists the blocks' grids, and the nearest size whose every grid square lands on the ruler wins, so
 * a 9" Nine Patch becomes 22.5 cm, not a size that cuts between marks.
 */
export function convertLength(value: number, from: Units, to: Units, options: number[], grids: number[] = []): number {
  if (from === to) return value;
  const target = (value / PER_INCH[from]) * PER_INCH[to];
  const ruler = MEASURES[to].ruler;
  const fits = (size: number) => grids.every((grid) => Math.abs(size / grid / ruler - Math.round(size / grid / ruler)) < 1e-6);
  const friendly = grids.length ? options.filter(fits) : [];
  const best = nearest(target, options);
  // A ruler-friendly size is only worth it within a step or two of the true conversion.
  if (friendly.length) {
    const candidate = nearest(target, friendly);
    if (Math.abs(candidate - target) <= Math.max(1.5, target * 0.06)) return candidate;
  }
  return best;
}

/** How a fabric width converts: to the system's usual width, as there are only a few. */
export const convertWof = (wof: number, from: Units, to: Units) => (from === to ? wof : to === "cm" ? MEASURES.cm.wof0 : MEASURES.in.wof0);

/** A length as a menu shows it: 3.5" as it always has, or 9,5 cm. */
export function formatLength(value: number, units: Units, locale: Locale): string {
  if (units === "in") return `${value}"`;
  return `${new Intl.NumberFormat(locale === "pt" ? "pt-BR" : locale, { maximumFractionDigits: 2 }).format(value)} cm`;
}

export const readUnits = (raw: string | null, locale: Locale): Units => (raw === "in" || raw === "cm" ? raw : defaultUnits(locale));
