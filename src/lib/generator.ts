/**
 * The site's only door to pattern generation. Generation runs in-process today
 * (`@/engine`); to move it to a backend, replace these function bodies with
 * fetch calls. Requests and results are already plain JSON and every function
 * is already async, so no caller has to change.
 */
import { generatePattern as runGenerate, listBlocks } from "@/engine";
import type { BlockInfo, PatternRequest, PatternResult } from "@/engine";

export type { BlockInfo, CutLine, FabricInfo, PatternRequest, PatternResult, Setting } from "@/engine";

export async function getBlocks(): Promise<BlockInfo[]> {
  return listBlocks();
}

export async function getBlock(slug: string): Promise<BlockInfo | undefined> {
  return listBlocks().find((b) => b.slug === slug);
}

export async function generatePattern(slug: string, request: PatternRequest): Promise<PatternResult> {
  return runGenerate(slug, request);
}

/** The printable pattern. Loaded on demand: pdf-lib is large and most visits never need it. */
export async function generatePdf(slug: string, request: PatternRequest): Promise<Uint8Array> {
  const { generatePatternPdf } = await import("@/engine/pdf");
  return generatePatternPdf(slug, request);
}
