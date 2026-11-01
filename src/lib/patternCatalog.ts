import catalog from "./patternCatalog.json";
import type { BlockInfo, Craft, Locale, StitchInfo } from "./patternTypes";

/**
 * What's in each pattern's page, so the site can list them without asking the API at
 * build time. `patternCatalog.json` is generated from the API's engine, and a test there
 * fails if the two differ.
 */

export async function getBlocks(locale: Locale = "en"): Promise<BlockInfo[]> {
  return catalog.blocks[locale];
}

export async function getBlock(slug: string, locale: Locale = "en"): Promise<BlockInfo | undefined> {
  return catalog.blocks[locale].find((b) => b.slug === slug);
}

export async function getStitchPatterns(craft: Craft, locale: Locale = "en"): Promise<StitchInfo[]> {
  return (catalog.stitches[locale] as StitchInfo[]).filter((s) => s.craft === craft);
}

export async function getStitchPattern(craft: Craft, slug: string, locale: Locale = "en"): Promise<StitchInfo | undefined> {
  return (catalog.stitches[locale] as StitchInfo[]).find((s) => s.craft === craft && s.slug === slug);
}
