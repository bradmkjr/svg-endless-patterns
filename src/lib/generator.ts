/**
 * The site's only door to pattern generation. Generation runs in-process today
 * (`@/engine`); to move it to a backend, replace these function bodies with
 * fetch calls. Requests and results are already plain JSON and every function
 * is already async, so no caller has to change.
 */
import { generatePattern as runGenerate, generateStitchPattern as runStitch, listBlocks, listStitchPatterns } from "@/engine";
import type { BlockInfo, Craft, Locale, PatternRequest, PatternResult, StitchInfo, StitchRequest, StitchResult } from "@/engine";

export type { BlockInfo, Craft, CutLine, FabricInfo, Locale, PatternRequest, PatternResult, Setting, StitchInfo, StitchRequest, StitchResult } from "@/engine";

export async function getBlocks(locale: Locale = "en"): Promise<BlockInfo[]> {
  return listBlocks(locale);
}

export async function getBlock(slug: string, locale: Locale = "en"): Promise<BlockInfo | undefined> {
  return listBlocks(locale).find((b) => b.slug === slug);
}

export async function generatePattern(slug: string, request: PatternRequest): Promise<PatternResult> {
  return runGenerate(slug, request);
}

/** The printable pattern. Loaded on demand: pdf-lib is large and most visits never need it. */
export async function generatePdf(slug: string, request: PatternRequest): Promise<Uint8Array> {
  const { generatePatternPdf } = await import("@/engine/pdf");
  return generatePatternPdf(slug, request);
}

export async function getStitchPatterns(craft: Craft, locale: Locale = "en"): Promise<StitchInfo[]> {
  return listStitchPatterns(locale).filter((s) => s.craft === craft);
}

export async function getStitchPattern(craft: Craft, slug: string, locale: Locale = "en"): Promise<StitchInfo | undefined> {
  return listStitchPatterns(locale).find((s) => s.craft === craft && s.slug === slug);
}

export async function generateStitchPattern(slug: string, request: StitchRequest): Promise<StitchResult> {
  return runStitch(slug, request);
}

export async function generateStitchPdf(slug: string, request: StitchRequest): Promise<Uint8Array> {
  const { generateStitchPdf: run } = await import("@/engine/stitchPdf");
  return run(slug, request);
}
