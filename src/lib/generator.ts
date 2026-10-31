/**
 * The site's only door to pattern generation. Maze generation runs through its
 * backend API; the other generators still run in-process until they are moved.
 */
import { generatePattern as runGenerate, generateStitchPattern as runStitch, generateCrossStitch as runCrossStitch, generateNeedlepoint as runNeedlepoint, generateTessellation as runTessellation, listTessellationOptions, generateSashiko as runSashiko, generateCelticKnot as runCelticKnot, generateStainedGlass as runStainedGlass, generateMandala as runMandala, mandalaMotifThumb as runMotifThumb, generateGirih as runGirih, generateTruchet as runTruchet, generateTieDye as runTieDye, generateTartan as runTartan, listBlocks, listStitchPatterns } from "@/engine";
import type { TessellationOptions, TessellationRequest, TessellationResult, SashikoRequest, SashikoResult, CelticKnotRequest, CelticKnotResult, StainedGlassRequest, StainedGlassResult, MandalaRequest, MandalaResult, GirihRequest, GirihResult, TruchetRequest, TruchetResult, TieDyeRequest, TieDyeResult, BlockInfo, Craft, Locale, PatternRequest, PatternResult, StitchInfo, StitchRequest, StitchResult, TartanRequest, TartanResult, CrossStitchRequest, CrossStitchResult, NeedlepointRequest, NeedlepointResult } from "@/engine";
import type { MazePaperId, MazeRequest, MazeResult } from "./mazeTypes";
import { mazeApiPost } from "./mazeApi";
import type { CheckerboardRequest, CheckerboardResult } from "./checkerboardTypes";
import type { CrochetColorworkRequest, CrochetColorworkResult } from "./crochetColorworkTypes";
import type { FractalRequest, FractalResult } from "./fractalTypes";
import type { KnitColorworkRequest, KnitColorworkResult } from "./knitColorworkTypes";

export type { TessellationColors, TessellationMotif, TessellationOptions, TessellationRequest, TessellationResult, GroupId, SashikoMotif, SashikoRequest, SashikoResult, CelticBreakPattern, CelticInterlace, CelticKnotRequest, CelticKnotResult, CelticStrand, StainedGlassColor, StainedGlassLayout, StainedGlassPiece, StainedGlassRequest, StainedGlassResult, MandalaMotif, MandalaRequest, MandalaResult, MandalaRing, MandalaRingSpec, GirihColors, GirihPart, GirihRequest, GirihResult, GirihStar, GirihSymmetry, TruchetArrangement, TruchetColors, TruchetRequest, TruchetResult, TruchetStyle, TieDyeMix, TieDyeRequest, TieDyeResult, TieDyeTechnique, BlockInfo, Craft, CutLine, FabricInfo, Locale, PatternRequest, PatternResult, Setting, StitchInfo, StitchRequest, StitchResult, TartanRequest, TartanResult, TartanStripe, CountedFinish, CrossStitchColor, CrossStitchRequest, CrossStitchResult, NeedlepointColor, NeedlepointRequest, NeedlepointResult, NeedlepointStitch, NeedlepointYarn } from "@/engine";
export type { KnitColorworkPlan, KnitColorworkRequest, KnitColorworkResult, KnitColorworkTechnique } from "./knitColorworkTypes";
export type { CheckerboardRequest, CheckerboardResult, CheckerPattern } from "./checkerboardTypes";
export type { ColorworkTechnique, ColorworkWeight, CrochetColorworkRequest, CrochetColorworkResult } from "./crochetColorworkTypes";
export type { FractalColors, FractalRequest, FractalResult, FractalType } from "./fractalTypes";
export type { MazeAlgorithm, MazeColors, MazeDifficulty, MazePaperId, MazeRequest, MazeResult, MazeShape, MazeSize } from "./mazeTypes";

export { DEFAULT_KNIT_SQUARE, KNIT_SQUARE_SIZES } from "@/engine";
export { MAZE_PAPERS, mazeAcross, mazeTallRows } from "./mazeOptions";

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

export async function generateNeedlepoint(request: NeedlepointRequest): Promise<NeedlepointResult> {
  return runNeedlepoint(request);
}

export async function generateNeedlepointPdf(request: NeedlepointRequest): Promise<Uint8Array> {
  const { generateNeedlepointPdf: run } = await import("@/engine/needlepointPdf");
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

export async function generateKnitColorwork(request: KnitColorworkRequest): Promise<KnitColorworkResult> {
  const response = await mazeApiPost("/knit-colorwork", request);
  return response.json() as Promise<KnitColorworkResult>;
}

export async function generateKnitColorworkPdf(request: KnitColorworkRequest): Promise<Uint8Array> {
  const response = await mazeApiPost("/knit-colorwork/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateCrochetColorwork(request: CrochetColorworkRequest): Promise<CrochetColorworkResult> {
  const response = await mazeApiPost("/crochet-colorwork", request);
  return response.json() as Promise<CrochetColorworkResult>;
}

export async function generateCrochetColorworkPdf(request: CrochetColorworkRequest): Promise<Uint8Array> {
  const response = await mazeApiPost("/crochet-colorwork/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateCheckerboard(request: CheckerboardRequest): Promise<CheckerboardResult> {
  const response = await mazeApiPost("/checkerboard", request);
  return response.json() as Promise<CheckerboardResult>;
}

export async function generateCheckerboardPdf(request: CheckerboardRequest): Promise<Uint8Array> {
  const response = await mazeApiPost("/checkerboard/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateFractal(request: FractalRequest): Promise<FractalResult> {
  const response = await mazeApiPost("/fractal", request);
  return response.json() as Promise<FractalResult>;
}

export async function generateFractalPdf(request: FractalRequest): Promise<Uint8Array> {
  const response = await mazeApiPost("/fractal/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateTieDye(request: TieDyeRequest): Promise<TieDyeResult> {
  return runTieDye(request);
}

export async function generateTieDyePdf(request: TieDyeRequest): Promise<Uint8Array> {
  const { generateTieDyePdf: run } = await import("@/engine/tieDyePdf");
  return run(request);
}

export async function generateMaze(request: MazeRequest): Promise<MazeResult> {
  const response = await mazeApiPost("/maze", request);
  return response.json() as Promise<MazeResult>;
}

export async function generateMazePosterPdf(request: MazeRequest, paper: MazePaperId): Promise<Uint8Array> {
  const response = await mazeApiPost(`/maze/poster-pdf?paper=${encodeURIComponent(paper)}`, request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateMazePdf(request: MazeRequest): Promise<Uint8Array> {
  const response = await mazeApiPost("/maze/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateMazePng(request: MazeRequest, view: "maze" | "solution", size: number): Promise<Uint8Array> {
  const query = new URLSearchParams({ view, size: String(size) });
  const response = await mazeApiPost(`/maze/png?${query}`, request, "image/png");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateTruchet(request: TruchetRequest): Promise<TruchetResult> {
  return runTruchet(request);
}

export async function generateTruchetPdf(request: TruchetRequest): Promise<Uint8Array> {
  const { generateTruchetPdf: run } = await import("@/engine/truchetPdf");
  return run(request);
}
