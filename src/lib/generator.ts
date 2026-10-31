/**
 * The site's only door to pattern generation. Generation runs in-process today
 * (`@/engine`); to move it to a backend, replace these function bodies with
 * fetch calls. Requests and results are already plain JSON and every function
 * is already async, so no caller has to change.
 */
import { generatePattern as runGenerate, generateStitchPattern as runStitch, generateCrossStitch as runCrossStitch, generateTessellation as runTessellation, listTessellationOptions, generateSashiko as runSashiko, generateCelticKnot as runCelticKnot, generateStainedGlass as runStainedGlass, generateMandala as runMandala, mandalaMotifThumb as runMotifThumb, generateGirih as runGirih, generateTruchet as runTruchet, generateTartan as runTartan, listBlocks, listStitchPatterns } from "@/engine";
import type { TessellationOptions, TessellationRequest, TessellationResult, SashikoRequest, SashikoResult, CelticKnotRequest, CelticKnotResult, StainedGlassRequest, StainedGlassResult, MandalaRequest, MandalaResult, GirihRequest, GirihResult, TruchetRequest, TruchetResult, BlockInfo, Craft, Locale, PatternRequest, PatternResult, StitchInfo, StitchRequest, StitchResult, TartanRequest, TartanResult, CrossStitchRequest, CrossStitchResult } from "@/engine";

export type { TessellationColors, TessellationMotif, TessellationOptions, TessellationRequest, TessellationResult, GroupId, SashikoMotif, SashikoRequest, SashikoResult, CelticBreakPattern, CelticInterlace, CelticKnotRequest, CelticKnotResult, CelticStrand, StainedGlassColor, StainedGlassLayout, StainedGlassPiece, StainedGlassRequest, StainedGlassResult, MandalaMotif, MandalaRequest, MandalaResult, MandalaRing, MandalaRingSpec, GirihColors, GirihPart, GirihRequest, GirihResult, GirihStar, GirihSymmetry, TruchetArrangement, TruchetColors, TruchetRequest, TruchetResult, TruchetStyle, BlockInfo, Craft, CutLine, FabricInfo, Locale, PatternRequest, PatternResult, Setting, StitchInfo, StitchRequest, StitchResult, TartanRequest, TartanResult, TartanStripe, CrossStitchColor, CrossStitchCraft, CrossStitchRequest, CrossStitchResult } from "@/engine";

export { DEFAULT_KNIT_SQUARE, KNIT_SQUARE_SIZES } from "@/engine";

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

export async function generateTartan(request: TartanRequest): Promise<TartanResult> {
  return runTartan(request);
}

export async function generateTartanPdf(request: TartanRequest): Promise<Uint8Array> {
  const { generateTartanPdf: run } = await import("@/engine/tartanPdf");
  return run(request);
}

export async function generateCrossStitch(request: CrossStitchRequest): Promise<CrossStitchResult> {
  return runCrossStitch(request);
}

export async function generateCrossStitchPdf(request: CrossStitchRequest): Promise<Uint8Array> {
  const { generateCrossStitchPdf: run } = await import("@/engine/crossStitchPdf");
  return run(request);
}

export async function getTessellationOptions(locale: Locale = "en"): Promise<TessellationOptions> {
  return listTessellationOptions(locale);
}

export async function generateTessellation(request: TessellationRequest): Promise<TessellationResult> {
  return runTessellation(request);
}

export async function generateTessellationPdf(request: TessellationRequest): Promise<Uint8Array> {
  const { generateTessellationPdf: run } = await import("@/engine/tessellationPdf");
  return run(request);
}

export async function generateSashiko(request: SashikoRequest): Promise<SashikoResult> {
  return runSashiko(request);
}

export async function generateSashikoPdf(request: SashikoRequest): Promise<Uint8Array> {
  const { generateSashikoPdf: run } = await import("@/engine/sashikoPdf");
  return run(request);
}

export async function generateCelticKnot(request: CelticKnotRequest): Promise<CelticKnotResult> {
  return runCelticKnot(request);
}

export async function generateCelticKnotPdf(request: CelticKnotRequest): Promise<Uint8Array> {
  const { generateCelticKnotPdf: run } = await import("@/engine/celticKnotPdf");
  return run(request);
}

export async function generateStainedGlass(request: StainedGlassRequest): Promise<StainedGlassResult> {
  return runStainedGlass(request);
}

export async function generateStainedGlassPdf(request: StainedGlassRequest): Promise<Uint8Array> {
  const { generateStainedGlassPdf: run } = await import("@/engine/stainedGlassPdf");
  return run(request);
}

export async function generateMandala(request: MandalaRequest): Promise<MandalaResult> {
  return runMandala(request);
}

export async function getMandalaMotifThumb(motif: Parameters<typeof runMotifThumb>[0]): Promise<string> {
  return runMotifThumb(motif);
}

export async function generateMandalaPdf(request: MandalaRequest): Promise<Uint8Array> {
  const { generateMandalaPdf: run } = await import("@/engine/mandalaPdf");
  return run(request);
}

export async function generateGirih(request: GirihRequest): Promise<GirihResult> {
  return runGirih(request);
}

export async function generateGirihPdf(request: GirihRequest): Promise<Uint8Array> {
  const { generateGirihPdf: run } = await import("@/engine/girihPdf");
  return run(request);
}

export async function generateTruchet(request: TruchetRequest): Promise<TruchetResult> {
  return runTruchet(request);
}

export async function generateTruchetPdf(request: TruchetRequest): Promise<Uint8Array> {
  const { generateTruchetPdf: run } = await import("@/engine/truchetPdf");
  return run(request);
}
